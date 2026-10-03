# Currency display

## Storage rule

USD is the only base currency. Every database and API amount uses an integer number of US cents, with a `Minor` suffix such as `startingPriceMinor`, `budgetMinor`, `amountMinor` or `priceMinor`. No currency field and no converted ZAR amount is stored.

For example, `priceMinor: 150000` means 1,500 USD.

## Display rule

USD is always available and is the default. The currency selector offers ZAR only when the server can establish that the request comes from South Africa and the current USD-to-ZAR rate is available. Location never changes the selection automatically. A user's explicit selection is kept in local storage between navigations and reloads.

The server recognises the `x-vercel-ip-country`, `cf-ipcountry` and trusted deployment `x-country-code` headers. If no country can be established, the application provides USD only. Set `DEVELOPMENT_COUNTRY=ZA` in `.env.local` to test both options locally.

## Conversion and formatting

The server obtains the USD-to-ZAR rate from Frankfurter's v2 rate endpoint. Next.js caches that request for six hours, so individual prices never make their own exchange-rate request. If the provider is unavailable, the application safely remains in USD.

Components call the currency context's `displayMoney()` function. It converts USD cents only when ZAR is selected and then delegates formatting to the shared `formatMoney(amountMinor, currency)` utility.

- USD: `1,000$`
- ZAR: `R 17,500`

Normal prices have comma separators and no decimal places. Changing display currency never writes to MongoDB and never changes the original USD value.

## Existing data

Legacy fields such as `startingPrice`, `budget`, `amount`, `price`, `priceUsd`, `priceZar` and `currency` are not accepted by the workspace API. Existing development records created before this change should be deleted and re-entered in USD. Do not automatically convert legacy values unless their original currency is known.
