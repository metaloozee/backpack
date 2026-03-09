"use client";

import {
	InlineCitation,
	InlineCitationCard,
	InlineCitationCardBody,
	InlineCitationCardTrigger,
	InlineCitationCarousel,
	InlineCitationCarouselContent,
	InlineCitationCarouselHeader,
	InlineCitationCarouselIndex,
	InlineCitationCarouselItem,
	InlineCitationCarouselNext,
	InlineCitationCarouselPrev,
	InlineCitationSource,
} from "@/components/ai-elements/inline-citation";

export function Citation({
	id,
	url,
	title,
	description,
}: {
	id: string;
	url: string;
	title: string;
	description: string;
}) {
	return (
		<InlineCitation key={id}>
			<InlineCitationCard>
				<InlineCitationCardTrigger sources={[url]} />
				<InlineCitationCardBody>
					<InlineCitationCarousel>
						<InlineCitationCarouselHeader>
							<InlineCitationCarouselPrev />
							<InlineCitationCarouselNext />
							<InlineCitationCarouselIndex />
						</InlineCitationCarouselHeader>
						<InlineCitationCarouselContent>
							<InlineCitationCarouselItem>
								<InlineCitationSource
									description={description}
									title={title}
									url={url}
								/>
							</InlineCitationCarouselItem>
						</InlineCitationCarouselContent>
					</InlineCitationCarousel>
				</InlineCitationCardBody>
			</InlineCitationCard>
		</InlineCitation>
	);
}
