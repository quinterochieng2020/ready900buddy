import { motion } from 'framer-motion';

interface UserBubbleProps {
  text: string;
}

export function UserBubble({ text }: UserBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex justify-end"
    >
      <div className="accent-gradient max-w-[85%] rounded-2xl rounded-tr-md border border-white/20 px-4 py-2.5 text-sm text-white shadow-md shadow-primary/20 sm:max-w-[75%]">
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>
    </motion.div>
  );
}
