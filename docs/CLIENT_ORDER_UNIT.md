# Client order unit

The public Home Kitchen client orders products only in whole kilograms.

- Visible client weight option: `1 кг` only.
- Client cart line unit: `1 кг × quantity`.
- Client checkout continues to send the existing `grams` API field, always in multiples of `1000`.
- Legacy cart entries are normalized to whole kilograms on the client before ordering.
- Supabase schema, owner application, catalog API contract and server-side price validation are unchanged.
