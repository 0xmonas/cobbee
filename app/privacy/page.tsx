import Link from "next/link"
import { Logo } from "@/components/logo"
import { SimpleFooter } from "@/components/simple-footer"

export default function PrivacyPage() {
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
        <h1 className="text-5xl font-black mb-4">Privacy Policy</h1>
        <p className="text-lg font-bold text-gray-600 mb-8">Last Updated: January 2025</p>

        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <p className="font-bold mb-4">
              Cobbee is a platform for creators to accept support from their audience through cryptocurrency payments.
              At Cobbee, your privacy is important to us, and we want you to feel confident that your personal
              information is secure when using our platform.
            </p>
            <p className="font-bold mb-4">
              It is Cobbee's policy to respect your privacy regarding any information we may collect while operating our
              website. However, you should be aware that blockchain transactions are public and permanent by nature, and
              certain information will be visible to all users as described in this policy.
            </p>
            <p className="font-bold mb-4">
              <strong>Important:</strong> Cobbee does not custody, process, or hold cryptocurrency funds. All
              transactions are peer-to-peer between user wallets on the blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Website Visitors</h2>
            <p className="font-bold mb-4">
              Like most website operators, Cobbee collects non-personally-identifying information of the sort that web
              browsers and servers typically make available, such as the browser type, language preference, referring
              site, and the date and time of each visitor request. Cobbee's purpose in collecting non-personally
              identifying information is to better understand how Cobbee's visitors use its website. From time to time,
              Cobbee may release non-personally-identifying information in the aggregate, e.g., by publishing a report
              on trends in the usage of its website.
            </p>
            <p className="font-bold mb-4">
              Cobbee also collects potentially personally-identifying information like Internet Protocol (IP) addresses
              for logged in users and for users making payments on Cobbee. Cobbee only discloses logged in user and
              commenter IP addresses under the same circumstances that it uses and discloses personally-identifying
              information as described below.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Cryptocurrency Payments and Financial Transactions</h2>
            <p className="font-bold mb-4">
              Cobbee does not process, custody, or hold cryptocurrency funds. All payments are peer-to-peer
              transactions conducted directly between your wallet and the creator's wallet on the blockchain. When you
              make a payment, you are interacting directly with blockchain networks (such as Ethereum), not with Cobbee
              as an intermediary.
            </p>
            <p className="font-bold mb-4">
              We do not collect or store your wallet's private keys, seed phrases, or have any access to your
              cryptocurrency funds. Your wallet security is entirely your responsibility.
            </p>
            <p className="font-bold mb-4">
              All blockchain transactions require network fees (gas fees) paid to blockchain validators, not to Cobbee.
              These fees are determined by network congestion and are beyond our control. Gas fees are paid in addition
              to your support amount and go directly to the blockchain network.
            </p>
            <p className="font-bold mb-4">
              We collect and display publicly available blockchain information including: transaction amounts, wallet
              addresses, transaction timestamps, and transaction hashes. This information is already public on the
              blockchain and accessible to anyone.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Gathering of Personally-Identifying Information</h2>
            <p className="font-bold mb-4">
              Certain visitors to Cobbee's websites choose to interact with Cobbee in ways that require Cobbee to
              gather personally-identifying information. The amount and type of information that Cobbee gathers depends
              on the nature of the interaction. For example, we ask visitors who sign up at Cobbee to provide a username
              and email address. In each case, Cobbee collects such information only insofar as is necessary or
              appropriate to fulfill the purpose of the visitor's interaction with Cobbee. Cobbee does not disclose
              personally-identifying information other than as described below. And visitors can always refuse to supply
              personally-identifying information, with the caveat that it may prevent them from engaging in certain
              website-related activities.
            </p>
            <p className="font-bold mb-4">
              You can request to delete your personal data by contacting us through the website.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Aggregated Statistics</h2>
            <p className="font-bold mb-4">
              Cobbee may collect statistics about the behavior of visitors to its websites. Cobbee may display this
              information publicly or provide it to others. However, Cobbee does not disclose personally-identifying
              information other than as described below.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Protection of Certain Personally-Identifying Information</h2>
            <p className="font-bold mb-4">
              Cobbee discloses potentially personally-identifying and personally-identifying information only to those
              of its employees, contractors and affiliated organizations that (i) need to know that information in order
              to process it on Cobbee's behalf or to provide services available at Cobbee's websites, and (ii) that
              have agreed not to disclose it to others. Some of those employees, contractors and affiliated
              organizations may be located outside of your home country; by using Cobbee's websites, you consent to the
              transfer of such information to them.
            </p>
            <p className="font-bold mb-4">
              Cobbee will not rent or sell potentially personally-identifying and personally-identifying information to
              anyone. Other than to its employees, contractors and affiliated organizations, as described above, Cobbee
              discloses potentially personally-identifying and personally-identifying information only in response to a
              subpoena, court order or other governmental request, or when Cobbee believes in good faith that disclosure
              is reasonably necessary to protect the property or rights of Cobbee, third parties or the public at large.
            </p>
            <p className="font-bold mb-4">
              If you are a registered user of a Cobbee website and have supplied your email address, Cobbee may
              occasionally send you an email to tell you about new features, solicit your feedback, or just keep you up
              to date with what's going on with Cobbee and our products.
            </p>
            <p className="font-bold mb-4">
              Cobbee takes all measures reasonably necessary to protect against the unauthorized access, use, alteration
              or destruction of potentially personally-identifying and personally-identifying information.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Account Deletion</h2>
            <p className="font-bold mb-4">
              You may stop using our Service by deleting your account through the Cobbee platform. Once you delete your
              account, all associated data will be removed following the deletion. If you have signed up for a
              membership, you will need to cancel your subscription in accordance with the cancellation terms. Merely
              deleting your account without canceling your subscription will not stop these payments.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Cookies</h2>
            <p className="font-bold mb-4">
              A cookie is a string of information that a website stores on a visitor's computer, and that the visitor's
              browser provides to the website each time the visitor returns.
            </p>
            <p className="font-bold mb-4">
              Cobbee uses cookies to help Cobbee identify and track visitors, their usage of Cobbee website, and their
              website access preferences. Cobbee visitors who do not wish to have cookies placed on their computers
              should set their browsers to refuse cookies before using Cobbee's websites, with the drawback that certain
              features of Cobbee's websites may not function properly without the aid of cookies.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Business Transfers</h2>
            <p className="font-bold mb-4">
              If Cobbee, or substantially all of its assets, were acquired, or in the unlikely event that Cobbee goes
              out of business or enters bankruptcy, user information would be one of the assets that is transferred or
              acquired by a third party. You acknowledge that such transfers may occur, and that any acquirer of Cobbee
              may continue to use your personal information as set forth in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Security</h2>
            <p className="font-bold mb-4">
              We use encryption protocols and security measures to protect your personal information from unauthorized
              access, use, or disclosure. However, no data transmission over the Internet or any wireless network can be
              guaranteed to be 100% secure. As a result, while we strive to protect your personal information, you
              acknowledge that: (a) there are security and privacy limitations inherent to the Internet that are beyond
              our control; and (b) the security, integrity, and privacy of any and all information and data exchanged
              between you and us through this site cannot be guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Public Information and Profile Visibility</h2>
            <p className="font-bold mb-4">
              By using Cobbee, you acknowledge that certain information will be publicly visible on creator profiles,
              including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 font-bold mb-4">
              <li>Creator wallet addresses</li>
              <li>Total support amounts received by creators</li>
              <li>Supporter names and messages (unless marked as private)</li>
              <li>Transaction amounts and timestamps</li>
              <li>Recent supporter activity</li>
            </ul>
            <p className="font-bold mb-4">
              All cryptocurrency transactions are permanently recorded on the public blockchain and cannot be deleted.
              While Cobbee may remove supporter information from our platform display, blockchain records remain
              permanently accessible.
            </p>
            <p className="font-bold mb-4">
              Creators have the right to hide or moderate supporter comments and messages on their profiles. Hidden
              content will not be displayed to visitors but may still exist in our database for moderation purposes.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Age Requirement</h2>
            <p className="font-bold mb-4">
              Cobbee does not knowingly collect personally identifiable information from individuals under the age of
              18. If you are under the age of 18, you must not use this website. If we become aware that a user is
              under 18, we will terminate their account and delete their information.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">International Users</h2>
            <p className="font-bold mb-4">
              If you are accessing our Services from regions with laws governing data collection and use, please note
              that your Personal Data may be transmitted to our servers and processed globally. By providing your
              information to the Services you agree to the transfer and processing of your information in accordance
              with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Privacy Policy Changes</h2>
            <p className="font-bold mb-4">
              Although most changes are likely to be minor, Cobbee may change its Privacy Policy from time to time, and
              in Cobbee's sole discretion. Cobbee encourages visitors to frequently check this page for any changes to
              its Privacy Policy. Your continued use of this site after any change in this Privacy Policy will
              constitute your acceptance of such change.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-black mb-4">Contact Us</h2>
            <p className="font-bold mb-4">
              Please feel free to contact us if you have any questions about Cobbee's Privacy Policy or the information
              practices through our website.
            </p>
          </section>
        </div>
      </div>

      <SimpleFooter />
    </div>
  )
}
