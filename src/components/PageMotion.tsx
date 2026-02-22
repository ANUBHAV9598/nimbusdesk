"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export default function PageMotion({ children }: Props) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.main
                key={pathname}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
            >
                {children}
            </motion.main>
        </AnimatePresence>
    );
}
