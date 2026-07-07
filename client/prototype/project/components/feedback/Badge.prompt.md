**Badge** — flat, sharp, uppercase chip for estimate status or generic labels. No rounding, no shadow.

```jsx
<Badge status="sent" />           {/* label auto-fills to "sent" */}
<Badge status="approved">Approved</Badge>
<Badge tone="warning">Expiring</Badge>
```

`status`: draft / sent / approved / rejected / revised. `tone`: neutral / navy / cyan / success / danger / warning.
