import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  AnimatePresence,
  HTMLMotionProps,
  motion,
  TargetAndTransition,
  useMotionValue,
  useSpring,
} from "motion/react"
import useMeasure from "react-use-measure"

import { cn } from "@/lib/utils"

const springConfig = { stiffness: 200, damping: 20, bounce: 0.2 }

interface ExpandableContextType {
  isExpanded: boolean
  toggleExpand: () => void
  expandDirection: "vertical" | "horizontal" | "both"
  expandBehavior: "replace" | "push"
  transitionDuration: number
  easeType:
    | "easeInOut"
    | "easeIn"
    | "easeOut"
    | "linear"
    | [number, number, number, number]
  initialDelay: number
  onExpandEnd?: () => void
  onCollapseEnd?: () => void
}

const ExpandableContext = createContext<ExpandableContextType>({
  isExpanded: false,
  toggleExpand: () => {},
  expandDirection: "vertical",
  expandBehavior: "replace",
  transitionDuration: 0.3,
  easeType: "easeInOut" as const,
  initialDelay: 0,
})

const useExpandable = () => useContext(ExpandableContext)

type ExpandablePropsBase = Omit<HTMLMotionProps<"div">, "children">

interface ExpandableProps extends ExpandablePropsBase {
  children: ReactNode | ((props: { isExpanded: boolean }) => ReactNode)
  expanded?: boolean
  onToggle?: () => void
  transitionDuration?: number
  easeType?:
    | "easeInOut"
    | "easeIn"
    | "easeOut"
    | "linear"
    | [number, number, number, number]
  expandDirection?: "vertical" | "horizontal" | "both"
  expandBehavior?: "replace" | "push"
  initialDelay?: number
  onExpandStart?: () => void
  onExpandEnd?: () => void
  onCollapseStart?: () => void
  onCollapseEnd?: () => void
}

const Expandable = React.forwardRef<HTMLDivElement, ExpandableProps>(
  (
    {
      children,
      expanded,
      onToggle,
      transitionDuration = 0.3,
      easeType = "easeInOut" as const,
      expandDirection = "vertical",
      expandBehavior = "replace",
      initialDelay = 0,
      onExpandStart,
      onExpandEnd,
      onCollapseStart,
      onCollapseEnd,
      ...props
    },
    ref
  ) => {
    const [isExpandedInternal, setIsExpandedInternal] = useState(false)
    const isExpanded = expanded !== undefined ? expanded : isExpandedInternal
    const toggleExpand =
      onToggle || (() => setIsExpandedInternal((prev) => !prev))

    useEffect(() => {
      if (isExpanded) {
        onExpandStart?.()
      } else {
        onCollapseStart?.()
      }
    }, [isExpanded, onExpandStart, onCollapseStart])

    const contextValue: ExpandableContextType = {
      isExpanded,
      toggleExpand,
      expandDirection,
      expandBehavior,
      transitionDuration,
      easeType,
      initialDelay,
      onExpandEnd,
      onCollapseEnd,
    }

    return (
      <ExpandableContext.Provider value={contextValue}>
        <motion.div
          ref={ref}
          initial={false}
          transition={{
            duration: transitionDuration,
            ease: easeType,
            delay: initialDelay,
          }}
          {...props}
        >
          {typeof children === "function" ? children({ isExpanded }) : children}
        </motion.div>
      </ExpandableContext.Provider>
    )
  }
)

type AnimationPreset = {
  initial: { [key: string]: any }
  animate: { [key: string]: any }
  exit: { [key: string]: any }
}

const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "slide-up": {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  "slide-down": {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  "slide-left": {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  "slide-right": {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  rotate: {
    initial: { opacity: 0, rotate: -10 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: -10 },
  },
  "blur-sm": {
    initial: { opacity: 0, filter: "blur(4px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(4px)" },
  },
  "blur-md": {
    initial: { opacity: 0, filter: "blur(8px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(8px)" },
  },
  "blur-lg": {
    initial: { opacity: 0, filter: "blur(16px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(16px)" },
  },
}

interface AnimationProps {
  initial?: TargetAndTransition
  animate?: TargetAndTransition
  exit?: TargetAndTransition
  transition?: any
}

const getAnimationProps = (
  preset: keyof typeof ANIMATION_PRESETS | undefined,
  animateIn?: AnimationProps,
  animateOut?: AnimationProps
) => {
  const defaultAnimation = {
    initial: {},
    animate: {},
    exit: {},
  }

  const presetAnimation = preset ? ANIMATION_PRESETS[preset] : defaultAnimation

  return {
    initial: animateIn?.initial || presetAnimation.initial,
    animate: animateIn?.animate || presetAnimation.animate,
    exit: animateOut?.exit || presetAnimation.exit,
  }
}

const ExpandableContent = React.forwardRef<
  HTMLDivElement,
  Omit<HTMLMotionProps<"div">, "ref"> & {
    preset?: keyof typeof ANIMATION_PRESETS
    animateIn?: AnimationProps
    animateOut?: AnimationProps
    stagger?: boolean
    staggerChildren?: number
    keepMounted?: boolean
  }
>(
  (
    {
      children,
      preset,
      animateIn,
      animateOut,
      stagger = false,
      staggerChildren = 0.1,
      keepMounted = false,
      ...props
    },
    ref
  ) => {
    const { isExpanded, transitionDuration, easeType } = useExpandable()
    const [measureRef, { height: measuredHeight }] = useMeasure()
    const animatedHeight = useMotionValue(0)
    const smoothHeight = useSpring(animatedHeight, springConfig)

    useEffect(() => {
      if (isExpanded) {
        animatedHeight.set(measuredHeight)
      } else {
        animatedHeight.set(0)
      }
    }, [isExpanded, measuredHeight, animatedHeight])

    const animationProps = getAnimationProps(preset, animateIn, animateOut)

    return (
      <motion.div
        ref={ref}
        style={{
          height: smoothHeight,
          overflow: "hidden",
        }}
        transition={{ duration: transitionDuration, ease: easeType }}
        {...props}
      >
        <AnimatePresence initial={false}>
          {(isExpanded || keepMounted) && (
            <motion.div
              ref={measureRef}
              initial={animationProps.initial}
              animate={animationProps.animate}
              exit={animationProps.exit}
              transition={{ duration: transitionDuration, ease: easeType }}
              className="pb-4"
            >
              {stagger ? (
                <motion.div
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: staggerChildren,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {React.Children.map(
                    children as React.ReactNode,
                    (child, index) => (
                      <motion.div
                        key={`${child?.toLocaleString}-${index}`}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                      >
                        {child}
                      </motion.div>
                    )
                  )}
                </motion.div>
              ) : (
                children
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

interface ExpandableCardProps {
  children: ReactNode
  className?: string
  collapsedSize?: { width?: number; height?: number }
  expandedSize?: { width?: number; height?: number }
  hoverToExpand?: boolean
  expandDelay?: number
  collapseDelay?: number
  darkMode?: boolean
}

const ExpandableCard = React.forwardRef<HTMLDivElement, ExpandableCardProps>(
  (
    {
      children,
      className = "",
      collapsedSize = { width: undefined, height: 180 },
      expandedSize = { width: undefined, height: 400 },
      hoverToExpand = false,
      expandDelay = 0,
      collapseDelay = 0,
      darkMode = false,
      ...props
    },
    ref
  ) => {
    const { isExpanded, toggleExpand, expandDirection } = useExpandable()
    const [measureRef, { width, height }] = useMeasure()
    const animatedWidth = useMotionValue(collapsedSize.width || 0)
    const animatedHeight = useMotionValue(collapsedSize.height || 0)
    const smoothWidth = useSpring(animatedWidth, springConfig)
    const smoothHeight = useSpring(animatedHeight, springConfig)

    useEffect(() => {
      if (isExpanded) {
        animatedWidth.set(expandedSize.width || width)
        animatedHeight.set(expandedSize.height || (height ? height + 18 : 0))
      } else {
        animatedWidth.set(collapsedSize.width || width)
        animatedHeight.set(collapsedSize.height || height)
      }
    }, [
      isExpanded,
      collapsedSize,
      expandedSize,
      width,
      height,
      animatedWidth,
      animatedHeight,
    ])

    const handleHover = () => {
      if (hoverToExpand && !isExpanded) {
        setTimeout(toggleExpand, expandDelay)
      }
    }

    const handleHoverEnd = () => {
      if (hoverToExpand && isExpanded) {
        setTimeout(toggleExpand, collapseDelay)
      }
    }

    return (
      <motion.div
        ref={ref}
        className={cn("w-full cursor-pointer", className)}
        style={{
          width:
            expandDirection === "vertical" ? "100%" : smoothWidth,
          height:
            expandDirection === "horizontal"
              ? collapsedSize.height
              : smoothHeight,
        }}
        transition={springConfig}
        onHoverStart={handleHover}
        onHoverEnd={handleHoverEnd}
        {...props}
      >
        <div
          className={cn(
            "grid grid-cols-1 rounded-[2rem] w-full h-full transition-all duration-300 ease-in-out",
            darkMode
              ? "border border-white/[0.03] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
              : "border border-black/[0.03] shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
          )}
        >
          <div
            className={cn(
              "grid grid-cols-1 rounded-[2rem] p-1.5 h-full",
              darkMode ? "bg-[#181818]" : "bg-slate-50/70"
            )}
          >
            <div
              className={cn(
                "rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] ring-1 transition-all duration-300 h-full overflow-hidden",
                darkMode
                  ? "bg-[#222222] ring-white/10 text-white"
                  : "bg-white ring-black/[0.02] text-gray-800"
              )}
            >
              <div ref={measureRef} className="w-full p-6 flex flex-col justify-between">
                {children}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
)

ExpandableCard.displayName = "ExpandableCard"

const ExpandableTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const { toggleExpand } = useExpandable()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggleExpand()
    }
  }

  return (
    <div
      ref={ref}
      onClick={toggleExpand}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Toggle expand"
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </div>
  )
})

ExpandableTrigger.displayName = "ExpandableTrigger"

const ExpandableCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    <motion.div layout className="flex justify-between items-start">
      {children}
    </motion.div>
  </div>
))

ExpandableCardHeader.displayName = "ExpandableCardHeader"

const ExpandableCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0 px-4 overflow-hidden flex-grow", className)}
    {...props}
  >
    <motion.div layout>{children}</motion.div>
  </div>
))
ExpandableCardContent.displayName = "ExpandableCardContent"

const ExpandableCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
))
ExpandableCardFooter.displayName = "ExpandableCardFooter"

export {
  Expandable,
  useExpandable,
  ExpandableCard,
  ExpandableContent,
  ExpandableContext,
  ExpandableTrigger,
  ExpandableCardHeader,
  ExpandableCardContent,
  ExpandableCardFooter,
}
