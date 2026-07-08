## Root-cause analysis

Based on live checks from this environment, the current source-of-truth DNS and Lovable routing are now correct.

### What I verified

1. **Authoritative Hostinger DNS is correct**
   - `@ns1.dns-parking.com viasetu.com A` returns `185.158.133.1`
   - `@ns2.dns-parking.com viasetu.com A` returns `185.158.133.1`
   - `www.viasetu.com` also returns `185.158.133.1` from both authoritative nameservers

2. **Public recursive DNS is now correct**
   - Google DNS `8.8.8.8` returns `185.158.133.1` for both `viasetu.com` and `www.viasetu.com`
   - Cloudflare DNS `1.1.1.1` returns `185.158.133.1` for both domains
   - DNS-over-HTTPS from Google and Cloudflare also returns `185.158.133.1`

3. **Lovable is routing the apex domain correctly**
   - `https://viasetu.com` returns `HTTP/2 200`
   - Response headers include a Lovable/Cloudflare deployment response, including `x-deployment-id`
   - This means the apex domain is attached to the current Lovable project and is being served successfully.

4. **`www` is currently redirecting to the apex domain**
   - `https://www.viasetu.com` returns `302` to `https://viasetu.com/`
   - Then `https://viasetu.com/` returns `200`
   - So Lovable is not requiring apex-to-www. In your current setup, the apex appears to be the primary domain and `www` redirects to it.

5. **The old Vercel error only appears when the apex is forced to the old Vercel IP**
   - Forcing `viasetu.com` to `216.198.79.1` returns:
     - `HTTP/2 404`
     - `server: Vercel`
     - `x-vercel-error: DEPLOYMENT_NOT_FOUND`
   - Forcing `viasetu.com` to `185.158.133.1` returns `HTTP/2 200`

## Precise diagnosis

The old Vercel page is not being caused by Lovable routing, a missing Lovable apex configuration, or a required apex-to-www redirect.

The Vercel error happens only when a resolver, browser, OS, router, ISP, or CDN cache still resolves `viasetu.com` to the old Vercel IP:

```text
216.198.79.1
```

When `viasetu.com` resolves to the correct Lovable IP:

```text
185.158.133.1
```

Lovable serves the site correctly.

So the root cause is stale DNS resolution somewhere outside the current authoritative Hostinger zone. Your Hostinger records appear correct now, and the active authoritative nameservers are returning the Lovable IP.

## Answers to your specific questions

### Is Lovable internally routing `viasetu.com` differently from `www.viasetu.com`?

No. Current evidence shows both domains are attached to this Lovable project. `www.viasetu.com` redirects to `viasetu.com`, and the apex domain serves the Lovable deployment successfully.

### Does Lovable require an apex redirect to `www`?

No. Your current Lovable configuration appears to use the apex domain as the primary destination, with `www` redirecting to the apex. That is valid.

### Is there stale deployment, edge cache, or old Vercel association still linked to this domain?

There may still be stale DNS caches on some client/network paths, but the live Vercel response is explained by DNS resolving to `216.198.79.1`, not by Lovable routing.

If the browser reaches `216.198.79.1`, Vercel will answer. If it reaches `185.158.133.1`, Lovable answers.

### Is Lovable expecting a different IP for the apex domain?

No. `185.158.133.1` is the correct Lovable IP for the apex domain, and it works when explicitly tested.

### Is the domain fully attached to the current project internally?

Yes. The project reports both custom domains attached:

```text
https://viasetu.com
https://www.viasetu.com
```

And `https://viasetu.com` currently returns a successful Lovable deployment response.

### Why did the apex serve old Vercel while the DNS panel looked correct?

Because some resolver path was still returning the old cached A record for the apex domain:

```text
viasetu.com -> 216.198.79.1
```

The DNS panel can be correct while recursive resolvers or local caches temporarily continue serving the previous value. Since `www` already resolved to `185.158.133.1`, it worked while the apex still failed on those stale paths.

## Do not overwrite these records

Do not overwrite or regenerate the current Hostinger DNS records if they are:

```text
A    @      185.158.133.1
A    www    185.158.133.1
```

Those are correct.

## Exact permanent-resolution steps

1. **Leave the current Hostinger DNS records unchanged**
   - Do not replace the Lovable IP.
   - Do not add another A record for the apex.
   - Do not add Vercel records back.

2. **Confirm there are no duplicate apex records in Hostinger**
   - There should be only one active `A` record for `@` pointing to `185.158.133.1`.
   - Remove any `A`, `AAAA`, ALIAS, ANAME, or CNAME-style flattening record for `@` that points to Vercel.
   - Based on authoritative DNS, this already appears clean.

3. **Flush local DNS caches where the Vercel page still appears**
   - Restart browser.
   - Clear browser DNS/socket cache.
   - Restart Wi-Fi/router if needed.
   - On macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
   - On Windows: `ipconfig /flushdns`

4. **Test using authoritative DNS, not only browser behavior**

   Use:

   ```bash
   dig @ns1.dns-parking.com viasetu.com A
   dig @ns2.dns-parking.com viasetu.com A
   dig @8.8.8.8 viasetu.com A
   dig @1.1.1.1 viasetu.com A
   ```

   All should return:

   ```text
   185.158.133.1
   ```

5. **If any public resolver still returns `216.198.79.1`**
   - That resolver is stale.
   - Wait for its cache to expire.
   - The current TTL shown is `14400` seconds, approximately 4 hours.
   - If an old record had a longer TTL, some networks may take longer.

6. **Optional cleanup in Vercel**
   - If you still have access to the old Vercel project/team, remove `viasetu.com` and `www.viasetu.com` from Vercel Domains.
   - This is cleanup only. It is not the primary fix, because DNS should no longer point traffic to Vercel.

## Final conclusion

The apex domain issue was caused by stale DNS resolution to the old Vercel IP `216.198.79.1`. The authoritative DNS is now correct, Lovable is accepting and serving `viasetu.com`, `www` redirects to the apex, and Lovable does not require a different apex IP or an apex-to-www redirect.