# Key design decisions, including AI overrides

## Tech Stack
My earliest decisions were tech stack. For a simple, lightweight application on a time crunch, I usually use choose TypeScript & Express for the API, rather than C# & .NET. Express is quick and easy and TS has the advantages of type safety and consistency with the frontend, for which I chose React (Vite) & TypeScript. I generally containerize my apps and deploye with AWS ECS, but for this quicker project I went with faster and simpler solutions: frontend deployed with Vercel and backend with Railway, for quick push-to-deploy.

## Money types
Floats and doubles can mess up our money calculations; the code uses integer cent counts to avoid this, and the database stores values asinteger-cents to keep consistency, even though it could use Decimals.

## Calculation order
Discount is applied before tax; that's what the industry standard is, as far as I can tell from the internet.

## Estimate math
Centralized all estimate math in a single pure module rather than distributing it, for a single source of truth on rounding and tax/discount ordering, and to make the money logic exhaustively unit-testable. For rounding, each line is rounded and then the lines are summed; this follows industry standards and makes displayed values consistent with each other, sacrificing a probably negligable amount of math accuracy. 

## Discounts and taxes
The app is designed to support discounts as both percentages and fixed amounts. This added some complexity, but felt like a feature that wasworth the extra work. 
Discounts and taxes are only applicable to a whole estimate, not per-line-item. Per-line discounts would be a good feature  to add with more time. 
Taxes are converted to basis points at the Zod validation stage and stored as such. 
Totals cannot go below zero, regardless of discount amount.

## Testing
Test driven development (failing unit tests before code) for services with real logic, like the estimate calculations; test-documented for UI and basic routing code.

## AI Workflow
To accelerate development with Claude Code while mainting control and quality, I followed a strict process of generating detailed plans, implementing in small steps, and commiting to feature branches to be merged with main upon feature completion. Details in CLAUDE.md. 