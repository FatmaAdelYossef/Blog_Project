# Roles and post ownership

The API uses two ASP.NET Identity roles. Role names live in
`SharedLayer/AppRoles.cs`; they are created at startup by `RoleSeeder`.

| Role | Capabilities |
| --- | --- |
| `Admin` | Manage every post, media item, and category; create posts and upload media. |
| `Author` | Create posts, upload media, and manage only the posts (and media) they own. |

New accounts should be assigned `Author`; the two development seed accounts are
assigned `Admin` because they are the project owners.

## Ownership rules

| Action | Anonymous | Author | Admin |
| --- | --- | --- | --- |
| Read posts / media | yes | yes | yes |
| Create post | no | yes (becomes the author) | yes (becomes the author) |
| Update / delete post | no | own posts only | any post |
| Add / update / delete post media | no | media on own posts only | any post |
| Create / update / delete category | no | no | yes |
| Upload image | no | yes | yes |

Ownership is enforced in `PostService` and `MediaService` through
`BusinessLogicLayer/Services/Authorization/PostAccess.cs`; controllers translate
`UnauthorizedAccessException` into HTTP 403.

`Post.AuthorId` is nullable on purpose. Rows that predate the `AddPostAuthorId`
migration have no author, so only an `Admin` can modify them. New posts always
receive the authenticated caller's user id.

## Notes

- JWT access tokens carry one role claim per assigned role, so authorization
  decisions do not require a database round-trip per request.
- Removing a user sets `Posts.AuthorId` to `NULL` (`ON DELETE SET NULL`) instead
  of deleting their posts; those posts then fall back to Admin-only management.
