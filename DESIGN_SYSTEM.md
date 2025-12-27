# MediaHub Unified Design System

This document outlines the token system used in MediaHub. All UI components should consume these tokens instead of hardcoded values.

## CSS Variables (Tokens)

### Colors

| Token | Description | Dark Mode (Default) | Light Mode |
| :--- | :--- | :--- | :--- |
| `--bg-root` | App background | `#050505` | `#fafafa` |
| `--bg-surface` | Card/Panel background | `#121212` | `#ffffff` |
| `--bg-surface-elevated` | Modals/Dropdowns | `#1e1e1e` | `#ffffff` |
| `--bg-surface-active` | Hover/Active states | `#2a2a2a` | `#f4f4f5` |
| `--border-subtle` | Subtle borders | `#27272a` | `#e4e4e7` |
| `--border-default` | Default borders | `#3f3f46` | `#d4d4d8` |

### Text

| Token | Description | Dark Mode | Light Mode |
| :--- | :--- | :--- | :--- |
| `--text-primary` | Main text | `#ffffff` | `#09090b` |
| `--text-secondary` | Secondary/Description | `#a1a1aa` | `#71717a` |
| `--text-muted` | Disabled/Subtle | `#52525b` | `#a1a1aa` |
| `--text-inverse` | Text on contrast bg | `#000000` | `#ffffff` |

### Semantic Colors

| Role | Token Prefix | Base Color |
| :--- | :--- | :--- |
| **Primary** | `--primary` | Teal (`#0d9488`) |
| **Danger** | `--danger` | Red (`#ef4444`) |
| **Success** | `--success` | Green (`#22c55e`) |
| **Warning** | `--warning` | Yellow (`#eab308`) |
| **Info** | `--info` | Blue (`#3b82f6`) |

Each semantic color has variants:
- `--primary-default`: Base color
- `--primary-hover`: Darker/Vibrant for hover
- `--primary-bg`: Subtle background (e.g., tags)
- `--primary-fg`: Text color on top of primary

### Spacing Scale

| Token | Value |
| :--- | :--- |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

### Typography

| Token | Value |
| :--- | :--- |
| `--font-sans` | `'Inter', sans-serif` |
| `--text-xs` | 0.75rem |
| `--text-sm` | 0.875rem |
| `--text-base` | 1rem |
| `--text-lg` | 1.125rem |
| `--text-xl` | 1.25rem |
| `--text-2xl` | 1.5rem |
| `--text-3xl` | 1.875rem |

### Radius

| Token | Value |
| :--- | :--- |
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-full` | 9999px |

## Usage Guidelines

- **Always** use `var(--token-name)` instead of hex values.
- **Always** use `clsx` allowing for clean conditional class names if using modules.
- **Do not** inline styles unless calculating dynamic values (e.g. coordinates).
