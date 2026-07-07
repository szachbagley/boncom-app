**Input** — single-line text field; hairline border, cyan focus border, sharp corners. Supports label, hint, error, and `$`/unit adornments.

```jsx
<Input label="Rate" prefix="$" suffix="/hr" placeholder="0.00" />
<Input label="Client" error="Required" />
```

Props: `label`, `hint`, `error`, `prefix`, `suffix`, plus all native input attributes.
