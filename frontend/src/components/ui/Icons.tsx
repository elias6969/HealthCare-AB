import type { ReactNode } from "react";

type IconProps = {
  className?: string;
  title?: string;
};

function SvgIcon({
  children,
  className,
  title,
}: IconProps & {
  children: ReactNode;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Calendar"}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M7 3.5v4" />
      <path d="M17 3.5v4" />
      <path d="M3.5 9h17" />
    </SvgIcon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Completed"}>
      <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
      <path d="m8 12 2.5 2.5L16 9" />
    </SvgIcon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Users"}>
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M12 13c-4 0-7 2-7 5v1.5h14V18c0-3-3-5-7-5Z" />
      <path d="M12 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
    </SvgIcon>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Clipboard"}>
      <rect x="7" y="4.5" width="10" height="16" rx="2" />
      <path d="M9 4.5V3.5h6v1" />
      <path d="M10 9h4" />
      <path d="M10 12h4" />
      <path d="M10 15h4" />
    </SvgIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Clock"}>
      <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
      <path d="M12 7v6l3 2" />
    </SvgIcon>
  );
}

export function ChartBarIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Chart"}>
      <path d="M4 19.5V4.5" />
      <path d="M4 19.5h16" />
      <path d="M8 17v-6" />
      <path d="M12 17V8" />
      <path d="M16 17v-3" />
    </SvgIcon>
  );
}

export function CogIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Settings"}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a8 8 0 0 0 .1-1l2-1.2-2-3.4-2.3.6a7.9 7.9 0 0 0-1.7-1L15.1 6h-6l-.4 2.9a7.9 7.9 0 0 0-1.7 1l-2.3-.6-2 3.4 2 1.2a8 8 0 0 0 .1 1 8 8 0 0 0-.1 1l-2 1.2 2 3.4 2.3-.6a7.9 7.9 0 0 0 1.7 1l.4 2.9h6l.4-2.9a7.9 7.9 0 0 0 1.7-1l2.3.6 2-3.4-2-1.2a8 8 0 0 0-.1-1Z" />
    </SvgIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Add"}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </SvgIcon>
  );
}

export function PillIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Prescription"}>
      <path d="M14.5 4.5a4.5 4.5 0 0 1 0 9l-6.5 6.5a4 4 0 1 1-5.7-5.7L8.8 7.8a4.5 4.5 0 0 1 5.7-3.3Z" />
      <path d="M8.8 7.8 16.2 15.2" />
    </SvgIcon>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "File"}>
      <path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5Z" />
      <path d="M14 3.5v5h5" />
      <path d="M8 12h8" />
      <path d="M8 15h8" />
    </SvgIcon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <SvgIcon {...props} title={props.title ?? "Mail"}>
      <path d="M4.5 7.5h15v9h-15z" />
      <path d="m4.5 8 7.5 5 7.5-5" />
    </SvgIcon>
  );
}


