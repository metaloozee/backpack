"use client";

import {
	BoldIcon,
	Code2Icon,
	Columns3Icon,
	Heading1Icon,
	Heading2Icon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	PilcrowIcon,
	QuoteIcon,
	Rows3Icon,
	Table2Icon,
	Trash2Icon,
} from "lucide-react";
import MarkdownIt from "markdown-it";
import { setBlockType, toggleMark, wrapIn } from "prosemirror-commands";
import { exampleSetup } from "prosemirror-example-setup";
import {
	defaultMarkdownParser,
	defaultMarkdownSerializer,
	MarkdownParser,
	MarkdownSerializer,
	schema as markdownSchema,
} from "prosemirror-markdown";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { Schema } from "prosemirror-model";
import { wrapInList } from "prosemirror-schema-list";
import { type Command, EditorState, type Transaction } from "prosemirror-state";
import {
	addColumnAfter,
	addRowAfter,
	deleteColumn,
	deleteRow,
	deleteTable,
	isInTable,
	tableNodes,
	toggleHeaderRow,
} from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import {
	Fragment,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface RichTextEditorProps {
	content: string;
	onChangeContent: (content: string) => void;
	status: "idle" | "streaming";
}

type ToolbarGroup = "block" | "mark" | "list" | "table";

interface ToolbarItem {
	ariaLabel: string;
	command: Command;
	group: ToolbarGroup;
	icon: typeof BoldIcon;
	isActive?: (view: EditorView) => boolean;
	requiresTable?: boolean;
}

const tableNodesSpec = tableNodes({
	tableGroup: "block",
	cellContent: "inline*",
	cellAttributes: {},
});

const schema = new Schema({
	nodes: {
		...markdownSchema.spec.nodes.toObject(),
		...tableNodesSpec,
	},
	marks: markdownSchema.spec.marks.toObject(),
});

const md = MarkdownIt("commonmark", { html: false }).enable("table");

const parser = new MarkdownParser(schema, md, {
	...defaultMarkdownParser.tokens,
	table: { block: "table" },
	thead: { ignore: true },
	tbody: { ignore: true },
	tr: { block: "table_row" },
	th: { block: "table_header" },
	td: { block: "table_cell" },
});

const serializer = new MarkdownSerializer(
	{
		...defaultMarkdownSerializer.nodes,
		table(state, node) {
			let firstRow = true;

			node.forEach((row) => {
				if (!firstRow) {
					state.ensureNewLine();
				}
				firstRow = false;

				state.write("| ");

				row.forEach((cell, _, cellIndex) => {
					state.renderInline(cell);
					state.write(cellIndex < row.childCount - 1 ? " | " : " |");
				});

				if (row.firstChild?.type.name === "table_header") {
					state.ensureNewLine();

					state.write("|");
					for (let i = 0; i < row.childCount; i++) {
						state.write("---");
						if (i < row.childCount - 1) {
							state.write("|");
						}
					}
					state.write("|");
				}
			});

			state.closeBlock(node);
		},
		table_row(state, node) {
			state.renderContent(node);
		},
		table_cell(state, node) {
			state.renderContent(node);
		},
		table_header(state, node) {
			state.renderContent(node);
		},
	},
	defaultMarkdownSerializer.marks
);

const parseMarkdownDocument = (content: string): ProseMirrorNode => {
	try {
		return parser.parse(content);
	} catch {
		const paragraph = schema.nodes.paragraph.create(
			null,
			content ? schema.text(content.replace(/\s+/g, " ")) : null
		);

		return schema.nodes.doc.create(null, paragraph);
	}
};

const serializeMarkdownDocument = (doc: ProseMirrorNode): string =>
	serializer.serialize(doc);

const runCommand = (view: EditorView | null, command: Command): void => {
	if (!view) {
		return;
	}

	command(view.state, view.dispatch, view);
	view.focus();
};

const canRunCommand = (view: EditorView | null, command: Command): boolean =>
	Boolean(view && command(view.state));

const isMarkActive = (view: EditorView, markName: string): boolean => {
	const markType = schema.marks[markName];
	if (!markType) {
		return false;
	}

	const { empty, from, to, $from } = view.state.selection;
	if (empty) {
		return Boolean(
			markType.isInSet(view.state.storedMarks ?? $from.marks())
		);
	}

	return view.state.doc.rangeHasMark(from, to, markType);
};

const isTextblockActive = (
	view: EditorView,
	nodeName: string,
	attrs?: Record<string, unknown>
): boolean => {
	const nodeType = schema.nodes[nodeName];
	if (!nodeType) {
		return false;
	}

	const parent = view.state.selection.$from.parent;
	if (parent.type !== nodeType) {
		return false;
	}

	return attrs
		? Object.entries(attrs).every(
				([key, value]) => parent.attrs[key] === value
			)
		: true;
};

const isWrappedInNode = (view: EditorView, nodeName: string): boolean => {
	const nodeType = schema.nodes[nodeName];
	if (!nodeType) {
		return false;
	}

	const { $from } = view.state.selection;
	for (let depth = $from.depth; depth > 0; depth -= 1) {
		if ($from.node(depth).type === nodeType) {
			return true;
		}
	}

	return false;
};

const insertTable = (
	state: EditorState,
	dispatch?: (tr: Transaction) => void
): boolean => {
	if (isInTable(state)) {
		return false;
	}

	const { table, table_row, table_header, table_cell } = schema.nodes;

	const headerCells = Array.from(
		{ length: 3 },
		() => table_header.createAndFill()!
	);
	const dataRows = Array.from({ length: 2 }, () => {
		const cells = Array.from(
			{ length: 3 },
			() => table_cell.createAndFill()!
		);
		return table_row.create(null, cells);
	});

	const tableNode = table.create(null, [
		table_row.create(null, headerCells),
		...dataRows,
	]);

	if (dispatch) {
		dispatch(state.tr.replaceSelectionWith(tableNode).scrollIntoView());
	}

	return true;
};

const useEditorToolbarItems = (): ToolbarItem[] =>
	useMemo(
		() => [
			{
				ariaLabel: "Paragraph",
				command: setBlockType(schema.nodes.paragraph),
				group: "block",
				icon: PilcrowIcon,
				isActive: (view: EditorView) =>
					isTextblockActive(view, "paragraph"),
			},
			{
				ariaLabel: "Heading 1",
				command: setBlockType(schema.nodes.heading, {
					level: 1,
				}),
				group: "block",
				icon: Heading1Icon,
				isActive: (view: EditorView) =>
					isTextblockActive(view, "heading", { level: 1 }),
			},
			{
				ariaLabel: "Heading 2",
				command: setBlockType(schema.nodes.heading, {
					level: 2,
				}),
				group: "block",
				icon: Heading2Icon,
				isActive: (view: EditorView) =>
					isTextblockActive(view, "heading", { level: 2 }),
			},
			{
				ariaLabel: "Bold",
				command: toggleMark(schema.marks.strong),
				group: "mark",
				icon: BoldIcon,
				isActive: (view: EditorView) => isMarkActive(view, "strong"),
			},
			{
				ariaLabel: "Italic",
				command: toggleMark(schema.marks.em),
				group: "mark",
				icon: ItalicIcon,
				isActive: (view: EditorView) => isMarkActive(view, "em"),
			},
			{
				ariaLabel: "Inline code",
				command: toggleMark(schema.marks.code),
				group: "mark",
				icon: Code2Icon,
				isActive: (view: EditorView) => isMarkActive(view, "code"),
			},
			{
				ariaLabel: "Bullet list",
				command: wrapInList(schema.nodes.bullet_list),
				group: "list",
				icon: ListIcon,
				isActive: (view: EditorView) =>
					isWrappedInNode(view, "bullet_list"),
			},
			{
				ariaLabel: "Ordered list",
				command: wrapInList(schema.nodes.ordered_list),
				group: "list",
				icon: ListOrderedIcon,
				isActive: (view: EditorView) =>
					isWrappedInNode(view, "ordered_list"),
			},
			{
				ariaLabel: "Quote",
				command: wrapIn(schema.nodes.blockquote),
				group: "list",
				icon: QuoteIcon,
				isActive: (view: EditorView) =>
					isWrappedInNode(view, "blockquote"),
			},
			{
				ariaLabel: "Insert table",
				command: insertTable,
				group: "table",
				icon: Table2Icon,
			},
			{
				ariaLabel: "Toggle header row",
				command: toggleHeaderRow,
				group: "table",
				icon: Table2Icon,
				isActive: () => false,
				requiresTable: true,
			},
			{
				ariaLabel: "Add column",
				command: addColumnAfter,
				group: "table",
				icon: Columns3Icon,
				requiresTable: true,
			},
			{
				ariaLabel: "Add row",
				command: addRowAfter,
				group: "table",
				icon: Rows3Icon,
				requiresTable: true,
			},
			{
				ariaLabel: "Delete column",
				command: deleteColumn,
				group: "table",
				icon: Columns3Icon,
				requiresTable: true,
			},
			{
				ariaLabel: "Delete row",
				command: deleteRow,
				group: "table",
				icon: Rows3Icon,
				requiresTable: true,
			},
			{
				ariaLabel: "Delete table",
				command: deleteTable,
				group: "table",
				icon: Trash2Icon,
				isActive: () => false,
				requiresTable: true,
			},
		],
		[]
	);

function PureRichTextEditor({
	content,
	onChangeContent,
	status,
}: RichTextEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<EditorView | null>(null);
	const initialContentRef = useRef(content);
	const latestContentRef = useRef(content);
	const statusRef = useRef(status);
	const [, forceToolbarUpdate] = useReducer((value: number) => value + 1, 0);
	const toolbarItems = useEditorToolbarItems();

	const dispatchTransaction = useCallback(
		(transaction: Transaction) => {
			const view = editorRef.current;
			if (!view) {
				return;
			}

			const nextState = view.state.apply(transaction);
			view.updateState(nextState);
			forceToolbarUpdate();

			if (transaction.docChanged && !transaction.getMeta("external")) {
				const nextContent = serializeMarkdownDocument(nextState.doc);
				latestContentRef.current = nextContent;
				onChangeContent(nextContent);
			}
		},
		[onChangeContent]
	);

	useEffect(() => {
		statusRef.current = status;
	}, [status]);

	useEffect(() => {
		if (!(containerRef.current && !editorRef.current)) {
			return;
		}

		const state = EditorState.create({
			doc: parseMarkdownDocument(initialContentRef.current),
			plugins: exampleSetup({
				schema,
				menuBar: false,
			}),
		});

		editorRef.current = new EditorView(containerRef.current, {
			state,
			dispatchTransaction,
			editable: () => statusRef.current !== "streaming",
			handleDOMEvents: {
				blur() {
					forceToolbarUpdate();
					return false;
				},
				focus() {
					forceToolbarUpdate();
					return false;
				},
				keyup() {
					forceToolbarUpdate();
					return false;
				},
				mouseup() {
					forceToolbarUpdate();
					return false;
				},
			},
		});

		return () => {
			editorRef.current?.destroy();
			editorRef.current = null;
		};
	}, [dispatchTransaction]);

	useEffect(() => {
		editorRef.current?.setProps({
			dispatchTransaction,
			editable: () => status !== "streaming",
		});
	}, [dispatchTransaction, status]);

	useEffect(() => {
		const view = editorRef.current;
		if (!view || latestContentRef.current === content) {
			return;
		}

		const currentContent = serializeMarkdownDocument(view.state.doc);
		if (currentContent === content) {
			latestContentRef.current = content;
			return;
		}

		const nextDocument = parseMarkdownDocument(content);
		const transaction = view.state.tr.replaceWith(
			0,
			view.state.doc.content.size,
			nextDocument.content
		);
		transaction.setMeta("external", true);
		view.dispatch(transaction);
		latestContentRef.current = content;
	}, [content]);

	const view = editorRef.current;
	const isInsideTable = Boolean(view && isInTable(view.state));
	let currentToolbarGroup: ToolbarGroup | null = null;

	return (
		<section
			aria-label="Rich text editor"
			className={cn(
				"flex h-full min-h-0 flex-col overflow-hidden bg-card dark:bg-neutral-900",
				status === "streaming" && "opacity-80"
			)}
		>
			<div
				aria-label="Editor formatting toolbar"
				className="flex shrink-0 items-center gap-1 overflow-x-auto border-b bg-card px-3 py-1.5 dark:bg-neutral-900"
				role="toolbar"
			>
				{toolbarItems.map((item) => {
					if (item.requiresTable && !isInsideTable) {
						return null;
					}

					const needsSeparator = Boolean(
						currentToolbarGroup &&
							currentToolbarGroup !== item.group
					);
					currentToolbarGroup = item.group;
					const isActive = view ? item.isActive?.(view) : false;
					const isDisabled =
						status === "streaming" ||
						!canRunCommand(view, item.command);

					return (
						<Fragment key={item.ariaLabel}>
							{needsSeparator ? (
								<div
									aria-hidden="true"
									className="mx-1 h-5 w-px bg-border"
								/>
							) : null}
							<EditorToolbarButton
								isActive={isActive}
								isDisabled={isDisabled}
								item={item}
								onRun={(command) => runCommand(view, command)}
							/>
						</Fragment>
					);
				})}
			</div>
			<div className="rich-text-editor min-h-0 flex-1 overflow-auto px-5 py-4">
				<div ref={containerRef} />
			</div>
		</section>
	);
}

function EditorToolbarButton({
	isActive,
	isDisabled,
	item,
	onRun,
}: {
	isActive?: boolean;
	isDisabled: boolean;
	item: ToolbarItem;
	onRun: (command: Command) => void;
}) {
	const Icon = item.icon;

	return (
		<Button
			aria-label={item.ariaLabel}
			aria-pressed={isActive}
			className={cn(
				"size-8",
				isActive && "bg-accent text-accent-foreground"
			)}
			disabled={isDisabled}
			onClick={(event) => {
				if (event.detail === 0) {
					onRun(item.command);
				}
			}}
			onMouseDown={(event) => {
				event.preventDefault();
				onRun(item.command);
			}}
			size="icon"
			title={item.ariaLabel}
			type="button"
			variant="ghost"
		>
			<Icon className="size-4" />
		</Button>
	);
}

function areEqual(
	prevProps: RichTextEditorProps,
	nextProps: RichTextEditorProps
) {
	return (
		prevProps.content === nextProps.content &&
		prevProps.onChangeContent === nextProps.onChangeContent &&
		prevProps.status === nextProps.status
	);
}

export const RichTextEditor = memo(PureRichTextEditor, areEqual);
