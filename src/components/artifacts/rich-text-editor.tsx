"use client";

import {
	BoldIcon,
	Code2Icon,
	Heading1Icon,
	Heading2Icon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	PilcrowIcon,
	QuoteIcon,
} from "lucide-react";
import { setBlockType, toggleMark, wrapIn } from "prosemirror-commands";
import { exampleSetup } from "prosemirror-example-setup";
import {
	defaultMarkdownParser,
	defaultMarkdownSerializer,
	schema as markdownSchema,
} from "prosemirror-markdown";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { wrapInList } from "prosemirror-schema-list";
import { type Command, EditorState, type Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
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

interface ToolbarItem {
	ariaLabel: string;
	command: Command;
	icon: typeof BoldIcon;
	isActive?: (view: EditorView) => boolean;
}

const parseMarkdownDocument = (content: string): ProseMirrorNode => {
	try {
		return defaultMarkdownParser.parse(content);
	} catch {
		const paragraph = markdownSchema.nodes.paragraph.create(
			null,
			content ? markdownSchema.text(content.replace(/\s+/g, " ")) : null
		);

		return markdownSchema.nodes.doc.create(null, paragraph);
	}
};

const serializeMarkdownDocument = (doc: ProseMirrorNode): string =>
	defaultMarkdownSerializer.serialize(doc);

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
	const markType = markdownSchema.marks[markName];
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
	const nodeType = markdownSchema.nodes[nodeName];
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
	const nodeType = markdownSchema.nodes[nodeName];
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

const useEditorToolbarItems = (): ToolbarItem[] =>
	useMemo(
		() => [
			{
				ariaLabel: "Paragraph",
				command: setBlockType(markdownSchema.nodes.paragraph),
				icon: PilcrowIcon,
				isActive: (view) => isTextblockActive(view, "paragraph"),
			},
			{
				ariaLabel: "Heading 1",
				command: setBlockType(markdownSchema.nodes.heading, {
					level: 1,
				}),
				icon: Heading1Icon,
				isActive: (view) =>
					isTextblockActive(view, "heading", { level: 1 }),
			},
			{
				ariaLabel: "Heading 2",
				command: setBlockType(markdownSchema.nodes.heading, {
					level: 2,
				}),
				icon: Heading2Icon,
				isActive: (view) =>
					isTextblockActive(view, "heading", { level: 2 }),
			},
			{
				ariaLabel: "Bold",
				command: toggleMark(markdownSchema.marks.strong),
				icon: BoldIcon,
				isActive: (view) => isMarkActive(view, "strong"),
			},
			{
				ariaLabel: "Italic",
				command: toggleMark(markdownSchema.marks.em),
				icon: ItalicIcon,
				isActive: (view) => isMarkActive(view, "em"),
			},
			{
				ariaLabel: "Inline code",
				command: toggleMark(markdownSchema.marks.code),
				icon: Code2Icon,
				isActive: (view) => isMarkActive(view, "code"),
			},
			{
				ariaLabel: "Bullet list",
				command: wrapInList(markdownSchema.nodes.bullet_list),
				icon: ListIcon,
				isActive: (view) => isWrappedInNode(view, "bullet_list"),
			},
			{
				ariaLabel: "Ordered list",
				command: wrapInList(markdownSchema.nodes.ordered_list),
				icon: ListOrderedIcon,
				isActive: (view) => isWrappedInNode(view, "ordered_list"),
			},
			{
				ariaLabel: "Quote",
				command: wrapIn(markdownSchema.nodes.blockquote),
				icon: QuoteIcon,
				isActive: (view) => isWrappedInNode(view, "blockquote"),
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
				schema: markdownSchema,
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

	return (
		<section
			aria-label="Rich text editor"
			className={cn(
				"flex h-full min-h-0 flex-col overflow-hidden bg-card dark:bg-neutral-900",
				status === "streaming" && "opacity-80"
			)}
		>
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
