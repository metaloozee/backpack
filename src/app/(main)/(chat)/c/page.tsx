import DisplayChats from "@/components/chat/display-chats";
import { Header } from "@/components/chat/header";

export default function Spaces() {
	return (
		<div className="m-20 flex flex-col items-start justify-center gap-5">
			<Header />
			<div className="mt-5 flex w-full max-w-5xl flex-row flex-wrap items-start justify-start gap-3">
				<DisplayChats />
			</div>
		</div>
	);
}
