| Field         | Value                                                 |
| ------------- | ----------------------------------------------------- |
| Feedback ID   | `UAT-RC1-001`                                         |
| Area          | Developer Experience / UAT Setup                      |
| Severity      | medium                                                |
| Status        | resolved                                              |
| Summary       | Missing local startup scripts                         |
| Resolution    | Added root/API/Web `dev` scripts and updated UAT docs |
| Target branch | `fix/p1-uat-local-startup-scripts`                    |



## Error Type
Recoverable Error

## Error Message
Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <HotReload assetPrefix="" globalError={[...]}>
      <AppDevOverlayErrorBoundary globalError={[...]}>
        <ReplaySsrOnlyErrors>
        <DevRootHTTPAccessFallbackBoundary>
          <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
            <HTTPAccessFallbackErrorBoundary pathname="/dashboard" notFound={<NotAllowedRootHTTPFallbackError>} ...>
              <RedirectBoundary>
                <RedirectErrorBoundary router={{...}}>
                  <Head headCacheNode={{lazyData:null, ...}}>
                    <__next_viewport_boundary__>
                    <MetadataTree>
                      <__next_metadata_boundary__>
                        <__next_metadata_boundary__>
                          <div
+                           hidden={true}
-                           hidden={null}
-                           data-v-7d889ae9=""
-                           className="odm_extension image_downloader_wrapper"
                          >
+                           <Suspense fallback={null}>
                  ...



    at Suspense (<anonymous>:null:null)

Next.js version: 15.5.15 (Webpack)



| Surface         | Environment | Mode       | Result | Notes                                                | Reviewer | Date       |
| --------------- | ----------- | ---------- | ------ | ---------------------------------------------------- | -------- | ---------- |
| API startup     | local       | local-safe | Pass   | Nest API started successfully                        | Pragalbh | 2026-05-10 |
| Web startup     | local       | local-safe | Pass   | Next app ready at `localhost:3000`                   | Pragalbh | 2026-05-10 |
| Dashboard route | local       | local-safe | Pass   | `/dashboard` returned 200                            | Pragalbh | 2026-05-10 |
| Audit route     | local       | local-safe | Pass   | `/audit` returned 200                                | Pragalbh | 2026-05-10 |
| Ponds route     | local       | local-safe | Pass   | `/ponds`, `/ponds/pond-1`, `/ponds/map` returned 200 | Pragalbh | 2026-05-10 |
| Alerts route    | local       | local-safe | Pass   | `/alerts` returned 200                               | Pragalbh | 2026-05-10 |
| Tasks route     | local       | local-safe | Pass   | `/tasks` returned 200                                | Pragalbh | 2026-05-10 |
| Reports route   | local       | local-safe | Pass   | `/reports` and AI report flows returned 200          | Pragalbh | 2026-05-10 |
