"use client";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { BookCopyIcon, SearchIcon } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Disclosure,
	DisclosureContent,
	DisclosureTrigger,
} from "@/components/ui/disclosure";
import { Loader } from "@/components/ui/loader";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface KnowledgeContext {
	content: string;
	knowledgeName: string;
	similarity: number;
}

interface KnowledgeSearchResult {
	keyword: string;
	contexts: KnowledgeContext[];
}

interface KnowledgeSearchToolProps {
	toolCallId: string;
	input?: {
		knowledge_search_keywords?: string[];
	};
	output?: {
		results?: KnowledgeSearchResult[];
	};
}

export function KnowledgeSearchTool({
	toolCallId,
	input,
	output,
}: KnowledgeSearchToolProps) {
	if (output) {
		return (
			<Accordion className="w-full">
				<AccordionItem
					className="min-w-0 rounded-md border bg-card px-4 dark:bg-neutral-900"
					value={toolCallId}
				>
					<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
						<span className="flex items-center gap-2 truncate">
							<BookCopyIcon className="size-3" />
							{"Knowledge Search"}
						</span>
						<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
					</AccordionTrigger>
					<AccordionContent className="space-y-1 overflow-hidden">
						{output?.results && output.results.length > 0
							? output.results.map((searchResult) => (
									<Disclosure
										className="flex w-full flex-col gap-2"
										key={`${toolCallId}-${searchResult.keyword}`}
									>
										<DisclosureTrigger className="w-full">
											<div className="flex w-full flex-row justify-between">
												<span className="flex items-center gap-2 truncate text-muted-foreground text-xs">
													<SearchIcon className="size-3" />
													{searchResult.keyword}
												</span>
											</div>
										</DisclosureTrigger>
										<DisclosureContent>
											<ScrollArea className="px-3 pb-3">
												<div className="flex w-max flex-row gap-2">
													{searchResult.contexts.map(
														(
															context: KnowledgeContext,
															ctxIdx: number
														) => (
															<div
																className="w-64 shrink-0 rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-transparent dark:bg-neutral-950"
																key={`${searchResult.keyword}-${ctxIdx}`}
															>
																<p className="line-clamp-2 font-medium text-primary text-sm">
																	{
																		context.knowledgeName
																	}
																</p>
																<p className="mt-1 text-muted-foreground text-xs">
																	{Math.round(
																		context.similarity *
																			100
																	)}
																	% match
																</p>
																<p className="mt-2 line-clamp-4 text-muted-foreground text-xs">
																	{
																		context.content
																	}
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
							: input?.knowledge_search_keywords?.map(
									(keyword: string) => (
										<Disclosure
											className="flex w-full flex-col gap-2"
											key={`${toolCallId}-placeholder-${keyword}`}
										>
											<DisclosureTrigger className="w-full">
												<div className="flex w-full flex-row justify-between">
													<span className="flex items-center gap-2 truncate text-muted-foreground text-xs">
														<BookCopyIcon className="size-3" />
														{keyword}
													</span>
												</div>
											</DisclosureTrigger>
											<DisclosureContent>
												<div className="rounded-md bg-card p-4 text-center text-muted-foreground dark:bg-neutral-950">
													No results found.
												</div>
											</DisclosureContent>
										</Disclosure>
									)
								)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		);
	}

	return (
		<Accordion className="w-full">
			<AccordionItem
				className="min-w-0 rounded-md border bg-card px-4 dark:bg-neutral-900"
				value={toolCallId}
			>
				<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
					<span className="flex items-center gap-2 truncate">
						<Loader size="sm" />
						{"Knowledge Search"}
					</span>
					<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
				</AccordionTrigger>
				<AccordionContent className="space-y-1">
					{input?.knowledge_search_keywords?.map(
						(keyword: string) => (
							<Disclosure
								className="flex w-full flex-col gap-2"
								key={`${toolCallId}-${keyword}`}
							>
								<DisclosureTrigger className="w-full">
									<div className="flex w-full flex-row justify-between">
										<span className="flex items-center gap-2 truncate text-muted-foreground text-xs">
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
						)
					)}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
