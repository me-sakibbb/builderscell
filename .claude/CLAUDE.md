Code Structure:
- Never do any heavy data processing inside a component
- Never do any data fetching inside a component
- These should be done inside respective hooks
- Always follow DRY principle
- When fetching long lists, always implement pagination. Pagination should be server side.
- Do not write/edit code through the terminal. Directly edit/write in the files.
- Never commit codes unless instructed
- Always ask clarifying questions before implementing any feature
- Never guess or hallucinate anything, when in doubt, ask questions.


Database Instructions:
- Always use the supabase mcp for any database related operations.
- When applying migrations, save the sql file as well along with the apply of migration
- Do NOT run any supabase operation through the terminal. Always use mcp server. Only if the task is not doable through mcp, then use the terminal.

UI Instructions:
- Stick the the theme always
- Show proper loading state when loading anything
- Never use emojis
- Never use magic colors, always define them globally and then use
