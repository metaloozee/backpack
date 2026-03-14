"use client";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { GraduationCapIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
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

interface AcademicSearchToolProps {
	toolCallId: string;
	input?: {
		academic_search_queries?: string[];
	};
	output?: Array<{
		query: string;
		results: Paper[];
	}>;
}

interface Paper {
	title: string;
	authors?: string;
	url: string;
	abstract?: string;
}

export function AcademicSearchTool({
	toolCallId,
	input,
	output,
}: AcademicSearchToolProps) {
	if (output) {
		return (
			<Accordion className="w-full">
				<AccordionItem
					className="min-w-0 rounded-md border bg-card px-4 dark:bg-neutral-900"
					value={toolCallId}
				>
					<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
						<span className="flex items-center gap-2 truncate">
							<GraduationCapIcon className="size-3" />
							{"Academic Search"}
						</span>
						<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
					</AccordionTrigger>
					<AccordionContent className="space-y-1 overflow-hidden">
						{output && output.length > 0
							? output.map((searchGroup) => (
									<Disclosure
										className="flex w-full flex-col gap-2"
										key={`${toolCallId}-${searchGroup.query}`}
									>
										<DisclosureTrigger className="w-full">
											<div className="flex w-full flex-row justify-between">
												<span className="flex items-center gap-2 truncate text-muted-foreground text-xs">
													<SearchIcon className="size-3" />
													{searchGroup.query}
												</span>
											</div>
										</DisclosureTrigger>
										<DisclosureContent>
											<ScrollArea className="px-3 pb-3">
												<div className="flex w-max flex-row gap-2">
													{searchGroup.results.map(
														(
															paper: Paper,
															resIdx: number
														) => (
															<div
																className="w-64 shrink-0 rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-transparent dark:bg-neutral-950"
																key={`${searchGroup.query}-${resIdx}`}
															>
																<Link
																	className="line-clamp-2 font-medium text-primary text-sm hover:underline"
																	href={
																		paper.url
																	}
																	rel="noopener noreferrer"
																	target="_blank"
																>
																	{
																		paper.title
																	}
																</Link>
																{paper.authors && (
																	<p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
																		{
																			paper.authors
																		}
																	</p>
																)}
																{paper.abstract && (
																	<p className="mt-2 line-clamp-4 text-muted-foreground text-xs">
																		{
																			paper.abstract
																		}
																	</p>
																)}
															</div>
														)
													)}
												</div>
												<ScrollBar orientation="horizontal" />
											</ScrollArea>
										</DisclosureContent>
									</Disclosure>
								))
							: input?.academic_search_queries?.map(
									(query: string) => (
										<Disclosure
											className="flex w-full flex-col gap-2"
											key={`${toolCallId}-placeholder-${query}`}
										>
											<DisclosureTrigger className="w-full">
												<div className="flex w-full flex-row justify-between">
													<span className="flex items-center gap-2 truncate text-muted-foreground text-xs">
														<GraduationCapIcon className="size-3" />
														{query}
													</span>
												</div>
											</DisclosureTrigger>
											<DisclosureContent>
												<div className="rounded-md bg-card p-4 text-center text-muted-foreground dark:bg-neutral-950">
													Academic search
													functionality is coming
													soon.
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
						{"Academic Search"}
					</span>
					<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
				</AccordionTrigger>
				<AccordionContent className="space-y-1">
					{input?.academic_search_queries?.map((query: string) => (
						<Disclosure
							className="flex w-full flex-col gap-2"
							key={`${toolCallId}-${query}`}
						>
							<DisclosureTrigger className="w-full">
								<div className="flex w-full flex-row justify-between">
									<span className="flex items-center gap-2 truncate text-muted-foreground text-xs">
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
