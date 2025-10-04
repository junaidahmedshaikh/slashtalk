
import { Users } from "lucide-react";

export default function ChatWindowSkeleton () {

    return <>
    <section  className="min-h-[calc(100dvh-56px)] lg:min-h-dvh bg-white dark:bg-gray-950">
    <div className="min-h-[calc(100dvh-56px)] lg:min-h-dvh bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Select a user to start chatting
          </p>
        </div>
      </div>
      </section>
    </>
}