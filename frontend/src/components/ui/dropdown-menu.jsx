import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/utils';

export function DropdownMenuRoot({ children, ...props }) {
  return <DropdownMenu.Root {...props}>{children}</DropdownMenu.Root>;
}

export function DropdownMenuTrigger({ className, ...props }) {
  return <DropdownMenu.Trigger className={cn(className)} {...props} />;
}

export function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[180px] overflow-hidden rounded-xl border border-subtle bg-surface p-1 shadow-float animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

export function DropdownMenuItem({ className, inset, ...props }) {
  return (
    <DropdownMenu.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-content-primary outline-none',
        'hover:bg-surface-elevated focus:bg-surface-elevated data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-surface-elevated" />;
}

export function DropdownMenuLabel({ className, ...props }) {
  return <DropdownMenu.Label className={cn('px-3 py-1.5 text-xs font-semibold text-content-muted', className)} {...props} />;
}

export function DropdownMenuRadioGroup({ children, ...props }) {
  return <DropdownMenu.RadioGroup {...props}>{children}</DropdownMenu.RadioGroup>;
}

export function DropdownMenuRadioItem({ className, ...props }) {
  return (
    <DropdownMenu.RadioItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-content-primary outline-none',
        'hover:bg-surface-elevated focus:bg-surface-elevated',
        className
      )}
      {...props}
    />
  );
}
