**Tabs** — flat underline tab row; active tab has a cyan underline and navy label, inactive are quiet gray. Optional per-tab count.

```jsx
<Tabs defaultValue="all" onChange={setTab} items={[
  {value:'all', label:'All', count:24},
  {value:'draft', label:'Drafts', count:5},
  {value:'sent', label:'Sent'},
]} />
```

Props: `items`, `value`/`defaultValue`, `onChange`.
