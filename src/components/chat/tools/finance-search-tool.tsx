"use client";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { LandmarkIcon, SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Disclosure, DisclosureContent, DisclosureTrigger } from "@/components/ui/disclosure";
import { Loader } from "@/components/ui/loader";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type SearchResult = {
	title: string;
	url: string;
	content: string;
};

type SearchGroup = {
	query: string;
	results: SearchResult[];
};

type FinanceSearchToolProps = {
	toolCallId: string;
	input?: {
		search_queries?: string[];
	};
	output?: {
		searches?: SearchGroup[];
	};
};

export function FinanceSearchTool({ toolCallId, input, output }: FinanceSearchToolProps) {
	if (output) {
		return (
			<Accordion className="w-full">
				<AccordionItem className="rounded-md border bg-neutral-900 px-4" value={toolCallId}>
					<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
						<span className="flex items-center gap-2 truncate">
							<LandmarkIcon className="size-3" />
							{"Finance Search"}
						</span>
						<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
					</AccordionTrigger>
					<AccordionContent className="space-y-1">
						{output?.searches?.map((searchGroup: SearchGroup, index: number) => (
							<Disclosure className="flex w-full flex-col gap-2" key={`${toolCallId}-${index}`}>
								<DisclosureTrigger className="w-full">
									<div className="flex w-full flex-row justify-between">
										<span className="flex items-center gap-2 truncate text-neutral-400 text-xs">
											<SearchIcon className="size-3" />
											{searchGroup.query}
										</span>
									</div>
								</DisclosureTrigger>

								<DisclosureContent>
									<ScrollArea className="px-3 pb-3">
										<div className="flex w-max flex-row gap-2">
											{searchGroup.results.map((searchResult: SearchResult, resIdx: number) => (
												<div
													className="w-64 shrink-0 rounded-lg bg-neutral-950 p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
													key={`${searchGroup.query}-${resIdx}`}
												>
													<Link
														className="line-clamp-2 font-medium text-primary text-sm hover:underline"
														href={searchResult.url}
														rel="noopener noreferrer"
														target="_blank"
													>
														<Image
															alt="favicon"
															className="mr-1.5 inline-block size-6 rounded border-3 align-middle"
															height={16}
															src={`https://www.google.com/s2/favicons?domain=${new URL(searchResult.url).hostname}&sz=16`}
															width={16}
														/>
														{searchResult.title}
													</Link>
													<p className="mt-2 line-clamp-4 text-muted-foreground text-xs">
														{searchResult.content}
													</p>
												</div>
											))}
										</div>
										<ScrollBar orientation="horizontal" />
									</ScrollArea>
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
						{"Finance Search"}
					</span>
					<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
				</AccordionTrigger>
				<AccordionContent className="space-y-1">
					{input?.search_queries?.map((query: string, index: number) => (
						<Disclosure className="flex w-full flex-col gap-2" key={`${toolCallId}-${index}`}>
							<DisclosureTrigger className="w-full">
								<div className="flex w-full flex-row justify-between">
									<span className="flex items-center gap-2 truncate text-neutral-400 text-xs">
										<Loader size="sm" />
										{query}
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
