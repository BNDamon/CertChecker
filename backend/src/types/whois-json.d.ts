declare module 'whois-json' {
  interface WhoisJsonOptions {
    follow?: number;
    timeout?: number;
    verbose?: boolean;
  }

  // whois-json's parsed shape is entirely dependent on what the upstream
  // registry's WHOIS server returns -- there is no fixed schema across TLDs.
  type WhoisJsonResult = Record<string, string | string[] | undefined>;

  function whois(domain: string, options?: WhoisJsonOptions): Promise<WhoisJsonResult>;
  export = whois;
}
