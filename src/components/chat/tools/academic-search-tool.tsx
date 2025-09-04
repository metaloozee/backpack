"use client";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { GraduationCapIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Disclosure, DisclosureContent, DisclosureTrigger } from "@/components/ui/disclosure";
import { Loader } from "@/components/ui/loader";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type AcademicSearchToolProps = {
	toolCallId: string;
	input?: {
		academic_search_queries?: string[];
	};
	output?: Array<{
		query: string;
		results: Paper[];
	}>;
};

type Paper = {
	title: string;
	authors?: string;
	url: string;
	abstract?: string;
};

export function AcademicSearchTool({ toolCallId, input, output }: AcademicSearchToolProps) {
	if (output) {
		return (
			<Accordion className="w-full">
				<AccordionItem className="rounded-md border bg-neutral-900 px-4" value={toolCallId}>
					<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
						<span className="flex items-center gap-2 truncate">
							<GraduationCapIcon className="size-3" />
							{"Academic Search"}
						</span>
						<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
					</AccordionTrigger>
					<AccordionContent className="space-y-1">
						{output && output.length > 0
							? output.map((searchGroup, index) => (
									<Disclosure className="flex w-full flex-col gap-2" key={`${toolCallId}-${index}`}>
										<DisclosureTrigger className="w-full">
											<div className="flex w-full flex-row justify-between">
												<span className="flex items-center gap-2 truncate text-neutral-400 text-xs">
													<SearchIcon className="size-3" />
													{input?.academic_search_queries?.[index] ?? searchGroup.query}
												</span>
											</div>
										</DisclosureTrigger>
										<DisclosureContent>
											<ScrollArea className="px-3 pb-3">
												<div className="flex w-max flex-row gap-2">
													{searchGroup.results.map((paper: Paper, resIdx: number) => (
														<div
															className="w-64 shrink-0 rounded-lg bg-neutral-950 p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
															key={`${searchGroup.query}-${resIdx}`}
														>
															<Link
																className="line-clamp-2 font-medium text-primary text-sm hover:underline"
																href={paper.url}
																target="_blank"
															>
																{paper.title}
															</Link>
															{paper.authors && (
																<p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
																	{paper.authors}
																</p>
															)}
															{paper.abstract && (
																<p className="mt-2 line-clamp-4 text-muted-foreground text-xs">
																	{paper.abstract}
																</p>
															)}
														</div>
													))}
												</div>
												<ScrollBar orientation="horizontal" />
											</ScrollArea>
										</DisclosureContent>
									</Disclosure>
								))
							: input?.academic_search_queries?.map((query: string, index: number) => (
									<Disclosure
										className="flex w-full flex-col gap-2"
										key={`${toolCallId}-placeholder-${index}`}
									>
										<DisclosureTrigger className="w-full">
											<div className="flex w-full flex-row justify-between">
												<span className="flex items-center gap-2 truncate text-neutral-400 text-xs">
													<GraduationCapIcon className="size-3" />
													{query}
												</span>
											</div>
										</DisclosureTrigger>
										<DisclosureContent>
											<div className="rounded-md bg-card p-4 text-center text-muted-foreground">
												Academic search functionality is coming soon.
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
						{"Academic Search"}
					</span>
					<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
				</AccordionTrigger>
				<AccordionContent className="space-y-1">
					{input?.academic_search_queries?.map((query: string, index: number) => (
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
