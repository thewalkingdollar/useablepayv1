# UseablePay

UseablePay is a responsive payment experience for settling everyday bills with mobile money. It presents a 1:1 KWD-backed UseableCoin balance, guides users through bill selection and a PIN-confirmation demo, and keeps completed payment activity in a Netlify Database.

## Technology

- TanStack Start, React 19, and TypeScript
- Netlify Database with Drizzle ORM
- Tailwind CSS plus a custom responsive design system
- Lucide icons and Zod validation

## Local development

Install dependencies and start the Netlify development environment:

```bash
pnpm install
netlify dev --port 8889
```

The payment flow is a product demo. Any four digits can be used in the approval screen; the PIN is validated in transit and never persisted. A real mobile-money provider must be connected before processing live funds.
