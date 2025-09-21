import { cn } from '@/lib/utils';
import * as React from 'react';

const PageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between border-b bg-muted/40 p-4 lg:p-6',
        className
      )}
      {...props}
    />
  );
});
PageHeader.displayName = 'PageHeader';

const PageHeaderHeading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h1
      ref={ref}
      className={cn('text-2xl font-bold tracking-tight', className)}
      {...props}
    />
  );
});
PageHeaderHeading.displayName = 'PageHeaderHeading';

const PageHeaderDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
PageHeaderDescription.displayName = 'PageHeaderDescription';

export { PageHeader, PageHeaderHeading, PageHeaderDescription };
