import { Chat } from "@/components/Chat";
import { generateId } from "ai";

export default function IndexPage() {
  const id = generateId();
  return <Chat id={id} />;
}
