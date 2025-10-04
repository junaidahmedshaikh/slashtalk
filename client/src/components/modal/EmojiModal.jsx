import { emojis } from "../../utils/constant"

export const EmojiModal = ({ onEmojiSelect, onClose }) => {
    return (
        <div className="absolute bottom-20 left-4 w-fit bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-3 shadow-lg z-30 max-w-xs">
            <div className="grid grid-cols-5 gap-2">
                {emojis.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => {
                            onEmojiSelect(emoji);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-lg transition-colors duration-150"
                        title={emoji}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}