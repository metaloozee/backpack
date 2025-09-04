"use client";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { BookCopyIcon, SearchIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Disclosure, DisclosureContent, DisclosureTrigger } from "@/components/ui/disclosure";
import { Loader } from "@/components/ui/loader";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type KnowledgeContext = {
	content: string;
	knowledgeName: string;
	similarity: number;
};

type KnowledgeSearchResult = {
	keyword: string;
	contexts: KnowledgeContext[];
};

type KnowledgeSearchToolProps = {
	toolCallId: string;
	input?: {
		knowledge_search_keywords?: string[];
	};
	output?: {
		results?: KnowledgeSearchResult[];
	};
};

export function KnowledgeSearchTool({ toolCallId, input, output }: KnowledgeSearchToolProps) {
	if (output) {
		return (
			<Accordion className="w-full">
				<AccordionItem className="rounded-md border bg-neutral-900 px-4" value={toolCallId}>
					<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
						<span className="flex items-center gap-2 truncate">
							<BookCopyIcon className="size-3" />
							{"Knowledge Search"}
						</span>
						<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
					</AccordionTrigger>
					<AccordionContent className="space-y-1">
						{output?.results && output.results.length > 0
							? output.results.map((searchResult, index) => (
									<Disclosure className="flex w-full flex-col gap-2" key={`${toolCallId}-${index}`}>
										<DisclosureTrigger className="w-full">
											<div className="flex w-full flex-row justify-between">
												<span className="flex items-center gap-2 truncate text-neutral-400 text-xs">
													<SearchIcon className="size-3" />
													{input?.knowledge_search_keywords?.[index] ?? searchResult.keyword}
												</span>
											</div>
										</DisclosureTrigger>
										<DisclosureContent>
											<ScrollArea className="px-3 pb-3">
												<div className="flex w-max flex-row gap-2">
													{searchResult.contexts.map(
														(context: KnowledgeContext, ctxIdx: number) => (
															<div
																className="w-64 shrink-0 rounded-lg bg-neutral-950 p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
																key={`${searchResult.keyword}-${ctxIdx}`}
															>
																<p className="line-clamp-2 font-medium text-primary text-sm">
																	{context.knowledgeName}
																</p>
																<p className="mt-1 text-muted-foreground text-xs">
																	{Math.round(context.similarity * 100)}% match
																</p>
																<p className="mt-2 line-clamp-4 text-muted-foreground text-xs">
																	{context.content}
																</p>
															</div>
														)
													)}
												</div>
												<ScrollBar orientation="horizontal" />
											</ScrollArea>
										</DisclosureContent>
									</Disclosure>
								))
							: input?.knowledge_search_keywords?.map((keyword: string, index: number) => (
									<Disclosure
										className="flex w-full flex-col gap-2"
										key={`${toolCallId}-placeholder-${index}`}
									>
										<DisclosureTrigger className="w-full">
											<div className="flex w-full flex-row justify-between">
												<span className="flex items-center gap-2 truncate text-neutral-400 text-xs">
													<BookCopyIcon className="size-3" />
													{keyword}
												</span>
											</div>
										</DisclosureTrigger>
										<DisclosureContent>
											<div className="rounded-md bg-card p-4 text-center text-muted-foreground">
												No results found.
											</div>
										</DisclosureContent>
									</Disclosure>
								))}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		);
	}

	return (
		<Accordion className="w-full">
			<AccordionItem className="rounded-md border bg-neutral-900 px-4" value={toolCallId}>
				<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
					<span className="flex items-center gap-2 truncate">
						<Loader size="sm" />
						{"Knowledge Search"}
					</span>
					<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
				</AccordionTrigger>
				<AccordionContent className="space-y-1">
					{input?.knowledge_search_keywords?.map((keyword: string, index: number) => (
						<Disclosure className="flex w-full flex-col gap-2" key={`${toolCallId}-${index}`}>
							<DisclosureTrigger className="w-full">
								<div className="flex w-full flex-row justify-between">
									<span className="flex items-center gap-2 truncate text-neutral-400 text-xs">
										<Loader size="sm" />
										{keyword}
									</span>
								</div>
							</DisclosureTrigger>
							<DisclosureContent>
								<div className="flex items-center gap-2 px-3 pb-3 text-muted-foreground text-xs">
									<Loader size="sm" />
									Searching...
								</div>
							</DisclosureContent>
						</Disclosure>
					))}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
