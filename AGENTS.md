<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Load the Users list through `src/lib/usuarios.ts` using separate RLS-protected profile and permission reads, joined by user ID; the tables have no direct foreign-key relationship.
- Keep location data access and query options in `src/lib/ubicaciones.ts`, backed by the existing external client and RLS; deliver schema changes as SQL for manual execution rather than provisioning a different backend.
