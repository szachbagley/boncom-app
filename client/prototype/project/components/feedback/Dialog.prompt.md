**Dialog** — centered modal over a navy scrim; sharp corners, cyan top rule, no shadow. Close on Escape or scrim click.

```jsx
<Dialog open={open} onClose={close} label="Confirm" title="Send estimate?"
  footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="accent">Send</Button></>}>
  <p>This will email the estimate to the client.</p>
</Dialog>
```

Props: `open`, `onClose`, `title`, `label`, `footer`, `width`.
