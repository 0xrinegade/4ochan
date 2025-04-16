import React from "react";
import { cn } from "@/lib/utils";

/*
 * Retro90sDesign - A design system for nostalgic 90s web aesthetics
 *
 * This file contains components that follow the 90s web design principles:
 * - Table-based layouts
 * - Simple color schemes
 * - No rounded corners
 * - Pixelated imagery
 * - Visible borders
 * - System fonts
 */

// ======= CONTAINERS =======

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const RetroContainer: React.FC<ContainerProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "bg-white border border-black p-4 mb-4",
      className
    )}>
      {children}
    </div>
  );
};

interface RetroSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const RetroSection: React.FC<RetroSectionProps> = ({ 
  title, 
  children,
  className 
}) => {
  return (
    <div className={cn("mb-4", className)}>
      <div className="bg-primary text-white font-bold px-2 py-1 border border-black">
        {title}
      </div>
      <div className="bg-white border-x border-b border-black p-2">
        {children}
      </div>
    </div>
  );
};

// ======= TYPOGRAPHY =======

interface TextProps {
  children: React.ReactNode;
  className?: string;
}

export const RetroHeading: React.FC<TextProps> = ({ 
  children, 
  className 
}) => {
  return (
    <h2 className={cn(
      "text-xl font-bold mb-2",
      className
    )}>
      {children}
    </h2>
  );
};

export const RetroSubheading: React.FC<TextProps> = ({ 
  children, 
  className 
}) => {
  return (
    <h3 className={cn(
      "text-lg font-bold mb-2 text-primary",
      className
    )}>
      {children}
    </h3>
  );
};

// ======= UI ELEMENTS =======

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const RetroButton: React.FC<ButtonProps> = ({ 
  children, 
  onClick,
  className,
  type = "button",
  disabled = false
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "bg-white border border-black px-2 py-1 text-sm",
        "hover:bg-secondary active:translate-y-[1px] active:translate-x-[1px]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
};

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

export const RetroInput: React.FC<InputProps> = ({
  type = "text",
  placeholder,
  value,
  onChange,
  className,
  name,
  id,
  required = false,
  disabled = false
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      id={id}
      required={required}
      disabled={disabled}
      className={cn(
        "border-2 border-black px-2 py-1 w-full bg-white",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
};

interface TextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export const RetroTextarea: React.FC<TextareaProps> = ({
  placeholder,
  value,
  onChange,
  className,
  name,
  id,
  required = false,
  disabled = false,
  rows = 4
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      id={id}
      required={required}
      disabled={disabled}
      rows={rows}
      className={cn(
        "border-2 border-black px-2 py-1 w-full bg-white",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
};

// ======= LAYOUT COMPONENTS =======

interface GridProps {
  children: React.ReactNode;
  columns?: number; // 1-4 columns
  gap?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
}

export const RetroGrid: React.FC<GridProps> = ({
  children,
  columns = 2,
  gap = 'medium',
  className
}) => {
  const gapClasses = {
    none: 'gap-0',
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-8'
  };
  
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };
  
  return (
    <div className={cn(
      'grid',
      gapClasses[gap],
      columnClasses[columns as keyof typeof columnClasses],
      className
    )}>
      {children}
    </div>
  );
};

interface TableProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
}

export const RetroTable: React.FC<TableProps> = ({
  children,
  className,
  border = true
}) => {
  return (
    <table className={cn(
      'w-full',
      border && 'border-collapse border border-black',
      className
    )}>
      {children}
    </table>
  );
};

export const RetroTh: React.FC<TextProps> = ({
  children,
  className
}) => {
  return (
    <th className={cn(
      'border border-black bg-primary text-white p-1 text-left',
      className
    )}>
      {children}
    </th>
  );
};

export const RetroTd: React.FC<TextProps> = ({
  children,
  className
}) => {
  return (
    <td className={cn(
      'border border-black p-1',
      className
    )}>
      {children}
    </td>
  );
};

// ======= DECORATIVE ELEMENTS =======

interface MarqueeProps {
  text: string;
  className?: string;
}

export const RetroMarquee: React.FC<MarqueeProps> = ({
  text,
  className
}) => {
  return (
    <div className={cn(
      'bg-white border border-black p-1 overflow-hidden whitespace-nowrap',
      'text-center mb-4',
      className
    )}>
      <span className="inline-block animate-marquee">
        {text}
      </span>
    </div>
  );
};

interface DividerProps {
  className?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

export const RetroDivider: React.FC<DividerProps> = ({
  className,
  style = 'solid'
}) => {
  const styleClasses = {
    solid: 'border-black',
    dashed: 'border-dashed border-black',
    dotted: 'border-dotted border-black'
  };
  
  return (
    <hr className={cn(
      'border-t-2 my-4',
      styleClasses[style],
      className
    )} />
  );
};

interface BadgeProps {
  text: string;
  color?: 'default' | 'primary' | 'new' | 'hot';
  className?: string;
}

export const RetroBadge: React.FC<BadgeProps> = ({
  text,
  color = 'default',
  className
}) => {
  const colorClasses = {
    default: 'bg-white text-black',
    primary: 'bg-primary text-white',
    new: 'bg-green-600 text-white',
    hot: 'bg-red-600 text-white'
  };
  
  return (
    <span className={cn(
      'inline-block border border-black px-1 text-xs font-bold',
      colorClasses[color],
      className
    )}>
      {text}
    </span>
  );
};

// ======= RESPONSIVE HELPERS =======

interface ResponsiveProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileOnly: React.FC<ResponsiveProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('block md:hidden', className)}>
      {children}
    </div>
  );
};

export const TabletUp: React.FC<ResponsiveProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('hidden md:block', className)}>
      {children}
    </div>
  );
};

export const DesktopOnly: React.FC<ResponsiveProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('hidden lg:block', className)}>
      {children}
    </div>
  );
};