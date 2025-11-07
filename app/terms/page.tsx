import Link from "next/link"
import { Logo } from "@/components/logo"
import { SimpleFooter } from "@/components/simple-footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="text-2xl font-black hidden sm:inline">Cobbee</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold hover:underline">
              Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-5xl font-black mb-4">Terms of Service</h1>
        <p className="text-lg font-bold text-gray-600 mb-8">Last Updated: January 2025</p>

        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <h2 className="text-3xl font-black mb-4">1. Acceptance of Terms</h2>
            <p className="font-bold mb-4">
              By accessing or using Cobbee ("the Site"), you agree to be bound by these Terms of Service ("Terms"). If
              you do not agree to these Terms, you must not use the Site.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">2. Description of Service</h2>
            <p className="font-bold mb-4">
              Cobbee is a platform that enables creators to receive support from their audience through cryptocurrency
              payments. The Site facilitates connections between creators and supporters by displaying profile pages and
              wallet addresses, but does not control, endorse, or guarantee any content, transactions, or interactions.
            </p>
            <p className="font-bold mb-4">
              <strong>Important:</strong> We are not a payment processor, financial institution, custodian, or money
              transmitter. All transactions are peer-to-peer and conducted directly between user wallets on the
              blockchain. Cobbee never takes custody of, processes, or has access to user funds. We simply provide a
              platform for users to display their wallet addresses and connect with supporters.
            </p>
            <p className="font-bold mb-4">
              Cobbee does not charge any fees on transactions. However, all blockchain transactions require network fees
              (gas fees) which are paid directly to blockchain validators, not to Cobbee.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">2.1. Experimental Service</h2>
            <p className="font-bold mb-4">
              Cobbee is provided as an experimental platform "AS IS" with no guarantees of uptime, data retention, or
              continued availability. We may suspend, modify, or discontinue any portion of the Site at any time
              without prior notice.
            </p>
            <p className="font-bold mb-4">
              Users are solely responsible for backing up their own data, transaction records, and important
              information. We are not responsible for any data loss, service interruption, or unavailability of
              features. Blockchain transactions are permanent and cannot be reversed by Cobbee.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">3. User Accounts</h2>
            <p className="font-bold mb-4">
              You must be at least 18 years of age to create an account and use Cobbee. By creating an account, you
              represent and warrant that you are at least 18 years old.
            </p>
            <p className="font-bold mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. You agree to notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">4. Cryptocurrency Payments and Financial Transactions</h2>
            <p className="font-bold mb-4">
              All transactions on the Site are peer-to-peer cryptocurrency payments conducted directly between user
              wallets on the blockchain. Cobbee does not process, custody, hold, or have any control over
              cryptocurrency funds. We are not a payment processor, financial institution, or money transmitter.
            </p>
            <p className="font-bold mb-4">By using the Site, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2 font-bold mb-4">
              <li>
                All cryptocurrency transactions are irreversible, final, and permanent on the blockchain. Once a
                transaction is confirmed, it cannot be cancelled, reversed, or refunded by Cobbee.
              </li>
              <li>
                You are solely responsible for all network fees (gas fees) associated with blockchain transactions.
                These fees are paid to blockchain validators, not to Cobbee, and vary based on network congestion.
              </li>
              <li>
                The value of cryptocurrency can fluctuate significantly. You bear all risk related to cryptocurrency
                price volatility.
              </li>
              <li>
                We do not control, custody, or have access to your cryptocurrency funds, private keys, or seed phrases.
              </li>
              <li>
                You are solely responsible for the security of your wallet, private keys, and all transactions initiated
                from your wallet.
              </li>
              <li>
                You must verify the recipient wallet address before confirming any transaction. Sending funds to an
                incorrect address may result in permanent loss.
              </li>
              <li>
                Cobbee is not responsible for any losses resulting from wallet hacks, phishing attacks, user error, or
                blockchain network issues.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">5. Prohibited Conduct</h2>
            <p className="font-bold mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 font-bold">
              <li>Violate any applicable laws or regulations</li>
              <li>Use the Site for fraudulent or illegal activities</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Upload or distribute malicious software</li>
              <li>Attempt to gain unauthorized access to the Site or other users' accounts</li>
              <li>Use the Site to promote illegal content or activities</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">6. Content and Public Information</h2>
            <p className="font-bold mb-4">
              You retain ownership of any content you submit to the Site. By posting content, you grant Cobbee a
              worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the
              platform. You represent and warrant that you have all necessary rights to the content you post.
            </p>
            <p className="font-bold mb-4">
              By using Cobbee, you acknowledge and agree that certain information will be publicly visible, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 font-bold mb-4">
              <li>Creator profiles, including wallet addresses and total support received</li>
              <li>Supporter names, messages, and support amounts (unless marked as private)</li>
              <li>All blockchain transaction data, which is permanently public and immutable</li>
            </ul>
            <p className="font-bold mb-4">
              Creators have the right to moderate, hide, or remove supporter comments and messages from their profile
              pages. This moderation does not affect blockchain records, which remain permanently accessible.
              Supporters acknowledge that creators may hide their messages at their sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">7. Third-Party Services</h2>
            <p className="font-bold mb-4">
              The Site integrates with third-party services including blockchain networks, cryptocurrency wallets, and
              external links. Cobbee does not control, moderate, or guarantee any third-party services, transactions,
              or linked content.
            </p>
            <p className="font-bold mb-4">
              Your interactions with external services (including wallet providers, blockchain networks, and linked
              websites) are solely between you and those providers. We disclaim all responsibility for third-party
              performance, safety, security, or legality. You use third-party services at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">8. Intellectual Property</h2>
            <p className="font-bold mb-4">
              All trademarks, branding, and original materials created by Cobbee remain our property. Users may not
              copy, modify, or redistribute any portion of the Cobbee platform or design except as permitted by law.
            </p>
            <p className="font-bold mb-4">
              User-generated content remains the property and responsibility of its respective creators. The Site and
              its original content, features, and functionality are owned by Cobbee and are protected by international
              copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">9. Disclaimer of Warranties</h2>
            <p className="font-bold mb-4">
              THE SITE AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, TITLE, OR NON-INFRINGEMENT.
            </p>
            <p className="font-bold mb-4">WE DO NOT GUARANTEE THAT:</p>
            <ul className="list-disc pl-6 space-y-2 font-bold mb-4">
              <li>THE SITE WILL BE CONTINUOUS, SECURE, ERROR-FREE, OR VIRUS-FREE</li>
              <li>ANY DATA, FILES, OR USER ACCOUNTS WILL REMAIN ACCESSIBLE OR UNCORRUPTED</li>
              <li>ANY TRANSACTION, BLOCKCHAIN INTERACTION, OR LINKED CONTENT WILL PERFORM AS EXPECTED</li>
              <li>THE PLATFORM WILL REMAIN AVAILABLE OR FUNCTIONAL AT ANY GIVEN TIME</li>
            </ul>
            <p className="font-bold mb-4">USE OF THE SITE IS ENTIRELY AT YOUR OWN RISK.</p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">10. Limitation of Liability</h2>
            <p className="font-bold mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, COBBEE, ITS OWNERS, OFFICERS, EMPLOYEES, AND CONTRACTORS SHALL
              NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
              LIMITED TO LOSS OF PROFITS, REVENUES, DATA, USE, REPUTATION, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF
              OR RELATING TO YOUR USE OR INABILITY TO USE THE SITE, ANY BLOCKCHAIN TRANSACTIONS, OR ANY LINKED SERVICE.
            </p>
            <p className="font-bold mb-4">
              YOUR SOLE REMEDY FOR DISSATISFACTION WITH THE SITE IS TO STOP USING IT.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">11. Indemnification</h2>
            <p className="font-bold mb-4">
              You agree to indemnify and hold harmless Cobbee and its affiliates from any claims, damages, or expenses
              (including attorneys' fees) arising out of:
            </p>
            <ul className="list-disc pl-6 space-y-2 font-bold mb-4">
              <li>Your use of the Site or linked services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights or applicable laws</li>
              <li>Any content you post or transactions you conduct</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">12. Termination</h2>
            <p className="font-bold mb-4">
              We reserve the right to suspend or terminate access to the Site at any time, for any reason, and without
              notice. You acknowledge that no data, files, or accounts are guaranteed to persist after termination or
              service discontinuation. Blockchain records will remain permanently on-chain regardless of account status.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">13. Governing Law & Dispute Resolution</h2>
            <p className="font-bold mb-4">
              These Terms are governed by applicable international laws, without regard to conflict-of-law principles.
              Any disputes shall be resolved through good faith negotiation. If negotiation fails, disputes may be
              resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
            <p className="font-bold mb-4">
              All disputes must be brought individually — no class actions or collective proceedings are permitted.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">14. Modifications</h2>
            <p className="font-bold mb-4">
              Cobbee may revise these Terms at any time by updating this page. Your continued use of the Site after any
              modification constitutes acceptance of the new Terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">15. Contact</h2>
            <p className="font-bold mb-4">
              For questions about these Terms, please contact us through our website.
            </p>
          </section>
        </div>
      </div>

      <SimpleFooter />
    </div>
  )
}
