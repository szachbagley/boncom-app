**Button** — the primary action primitive; sharp-cornered, flat, no shadow, uppercase label. Use for any commit/submit/navigate action.

```jsx
<Button variant="primary" size="md" onClick={save}>Save estimate</Button>
```

Variants: `primary` (navy — default action), `accent` (cyan), `emphasis` (orange — reserved for rare pop), `secondary` (navy outline), `ghost` (quiet), `danger` (muted-red outline for destructive). Sizes `sm | md | lg`. Props: `fullWidth`, `disabled`, `iconLeft`, `iconRight`.
