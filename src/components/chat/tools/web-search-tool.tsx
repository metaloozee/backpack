/** biome-ignore-all lint/performance/noImgElement: we need to use the img element to display the image */
/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: we need to use the span element to display the text */
/** biome-ignore-all lint/nursery/useImageSize: we need to use the img element to display the image */
"use client";

import { ChevronDownIcon } from "@radix-ui/react-icons";
import { GlobeIcon, SearchIcon } from "lucide-react";
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
	images?: {
		url: string;
		description: string;
	}[];
};

type WebSearchToolProps = {
	toolCallId: string;
	input?: {
		web_search_queries?: string[];
	};
	output?: {
		searches?: SearchGroup[];
	};
};

export function WebSearchTool({ toolCallId, input, output }: WebSearchToolProps) {
	const flattenedImages: {
		src: string;
		title: string;
		url: string;
		domain: string;
	}[] = output?.searches
		? Array.from(
				new Map(
					output.searches
						.flatMap((group) => group.images || [])
						.filter((img) => Boolean(img.url))
						.map((img) => {
							const src = img.url;
							const url = img.url;
							const domain = new URL(img.url).hostname.replace("www.", "");
							const title = img.description || domain;
							return [src, { src, title, url, domain }];
						})
				).values()
			)
		: [];

	if (output) {
		return (
			<div className="flex w-full flex-col gap-2">
				{flattenedImages.length > 0 && (
					<div className="mt-2">
						<ScrollArea className="bg-neutral-950 pb-2">
							<div className="flex w-max flex-row gap-3">
								{flattenedImages.slice(0, 24).map((img) => (
									<a
										className="group relative block h-40 w-64 overflow-hidden rounded-lg transition-all duration-200"
										href={img.url}
										key={img.src}
										rel="noopener noreferrer"
										target="_blank"
									>
										<Image
											alt={img.title}
											className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
											fill
											sizes="(max-width: 768px) 100vw, 256px"
											src={img.src}
											unoptimized
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
										<div className="absolute top-2 left-2 flex items-center gap-2 rounded bg-black/50 px-2 py-1 text-[10px] text-white/80 backdrop-blur">
											<Image
												alt="favicon"
												className="size-3.5 rounded"
												height={16}
												src={`https://www.google.com/s2/favicons?domain=${img.domain}&sz=16`}
												unoptimized
												width={16}
											/>
											<span className="max-w-[9rem] truncate">{img.domain}</span>
										</div>
										<div className="absolute right-2 bottom-2 left-2 line-clamp-2 text-[11px] text-white/95 leading-tight">
											{img.title}
										</div>
									</a>
								))}
							</div>
							<ScrollBar orientation="horizontal" />
						</ScrollArea>
					</div>
				)}

				<Accordion className="w-full">
					<AccordionItem className="rounded-md border bg-neutral-900 px-4" value={toolCallId}>
						<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
							<span className="flex items-center gap-2 truncate">
								<GlobeIcon className="size-3" />
								{"Web Search"}
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
												{searchGroup.results.map(
													(searchResult: SearchResult, resIdx: number) => (
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
																	unoptimized
																	width={16}
																/>
																{searchResult.title}
															</Link>
															<p className="mt-2 line-clamp-4 text-muted-foreground text-xs">
																{searchResult.content}
															</p>
														</div>
													)
												)}
											</div>
											<ScrollBar orientation="horizontal" />
										</ScrollArea>
									</DisclosureContent>
								</Disclosure>
							))}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		);
	}

	return (
		<Accordion className="w-full">
			<AccordionItem className="rounded-md border bg-neutral-900 px-4" value={toolCallId}>
				<AccordionTrigger className="flex h-10 w-full items-center justify-between gap-2 text-xs">
					<span className="flex items-center gap-2 truncate">
						<Loader size="sm" />
						{"Web Search"}
					</span>
					<ChevronDownIcon className="size-3 transition-transform duration-200 group-data-[expanded]:rotate-180" />
				</AccordionTrigger>
				<AccordionContent className="space-y-1">
					{input?.web_search_queries?.map((query: string, index: number) => (
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
