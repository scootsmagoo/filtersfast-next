/**
 * Sweepstakes Official Rules Page
 * 
 * Legal terms and conditions for FiltersFast giveaways
 * Based on the legacy FiltersFast sweepstakes rules
 */

import { Scale } from 'lucide-react';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function SweepstakesRulesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/giveaway" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Giveaways
          </Link>
        </div>

        <Card className="p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Official Sweepstakes Rules
            </h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Official rules and regulations for FiltersFast.com promotional giveaways and sweepstakes.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">ELIGIBILITY</h2>
            <p className="text-gray-700 leading-relaxed">
              No purchase necessary to enter or win. FiltersFast.com giveaways and sweepstakes (the "Sweepstakes") 
              are open to legal residents of the United States who are eighteen (18) years of age or older as of 
              the date of entry and are void where prohibited by law. Employees of FiltersFast.com, their respective 
              affiliates, subsidiaries, advertising and promotion agencies, suppliers and their immediate family 
              members and/or those living in the same household of each are not eligible to participate in the 
              Sweepstakes. By entering this Sweepstakes, you agree to these Terms & Conditions, and FiltersFast.com's 
              Terms of Service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">DURATION</h2>
            <p className="text-gray-700 leading-relaxed">
              Each giveaway has its own entry period as displayed on the giveaway page. The entry period begins and 
              ends on the dates specified for each individual sweepstakes. All entries must be received before the 
              end date and time specified for that particular giveaway.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">HOW TO ENTER</h2>
            <p className="text-gray-700 leading-relaxed">
              To enter the Sweepstakes, you must submit your valid name and email address during the entry period 
              through the online entry form provided on the giveaway page. Limit one entry per person per giveaway. 
              Multiple entries from the same person will be disqualified.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">PRIZE</h2>
            <p className="text-gray-700 leading-relaxed">
              Prize details are specified on each individual giveaway page. The number of winners and prize 
              descriptions vary by sweepstakes. All federal, state, and local taxes on prize value, if applicable, 
              are the responsibility of the winner. No substitution, cash redemption or transfer of the right to 
              receive a prize is permitted, except in the discretion of FiltersFast.com, which reserves the right 
              to substitute a prize of equal or greater value. All expenses or costs associated with the acceptance 
              or use of the prize are the responsibility of the winner. Prizes are awarded "as is" and without any 
              warranty, except as required by law.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">WINNER SELECTION</h2>
            <p className="text-gray-700 leading-relaxed">
              The Winner(s) of the Sweepstakes will be selected in a random drawing from among all eligible entries 
              received throughout the Entry Period. The random drawing will be conducted after the Promotion Period 
              by FiltersFast.com, whose decisions are final. Odds of winning will vary depending on the number of 
              eligible entries received.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">WINNER NOTIFICATION</h2>
            <p className="text-gray-700 leading-relaxed">
              Winner(s) will be notified by email at the email address provided in the Entry Information approximately 
              two weeks after the random drawing. Potential Winner must accept a prize by email as directed by 
              FiltersFast.com within two weeks of notification. FiltersFast.com is not responsible for any delay or 
              failure to receive notification for any reason, including inactive email account(s), technical 
              difficulties associated therewith, or Winner's failure to adequately monitor any email account. Any 
              winner notification not responded to or returned as undeliverable may result in prize forfeiture. No 
              substitution or transfer of a prize is permitted except by FiltersFast.com.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">ENTRANT GRANTS OF RIGHTS</h2>
            <p className="text-gray-700 leading-relaxed">
              By entering the sweepstakes, each entrant grants permission to FiltersFast.com and its affiliates, 
              subsidiaries, agents and licensees to use the entrant's name, voice, image, hometown, biographical 
              information and/or likenesses for advertising, publicity and promotional purposes without further 
              compensation (unless prohibited by law) and to execute specific consent to such use if asked to do so. 
              This Sweepstakes is subject to all applicable laws and regulations.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">GENERAL RULES</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              FiltersFast.com, its affiliates, subsidiaries, agencies, and representatives and their respective 
              directors, officers, and employees are not responsible and shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Electronic, hardware or software program, network, internet or computer malfunctions, failures, 
                  or difficulties of any kind, including without limitation, server malfunction or by any error 
                  (human or otherwise) which may occur in the processing of entries</li>
              <li>Failed, incomplete, garbled or delayed computer transmissions</li>
              <li>Late, lost, misdirected, incomplete entries</li>
              <li>Any condition caused by events beyond the control of FiltersFast.com that may cause the promotion 
                  to be disrupted or corrupted</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              FiltersFast.com reserves the right in its sole discretion to cancel or suspend the sweepstakes or any 
              portion thereof should virus, bugs, or other causes beyond control of FiltersFast.com corrupt the 
              administration, security, or proper play of the Sweepstakes. FiltersFast.com further reserves the right 
              to modify these Terms & Conditions or modify, suspend, or terminate the Sweepstakes at any time in its 
              discretion.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By entering the Sweepstakes, you agree to receive email newsletters periodically from FiltersFast.com. 
              You can opt-out of receiving this communication at any time by clicking the unsubscribe link in the 
              newsletter.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">GOVERNING LAW</h2>
            <p className="text-gray-700 leading-relaxed">
              All issues and questions concerning the construction, validity, interpretation, and enforceability of 
              these Terms & Conditions or the rights and obligations of customer or FiltersFast.com in connection with 
              the Sweepstakes shall be governed by and construed in accordance with the laws of the state of North 
              Carolina without giving effect to any choice of law or conflict of law rules or provisions that would 
              cause the application of any other state laws. Claims may not be resolved through any form of class 
              action. Venue for all suits will be in federal or state courts located in Charlotte, North Carolina.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">PRIVACY</h2>
            <p className="text-gray-700 leading-relaxed">
              Any personal information supplied by the entrant will be subject to FiltersFast.com's Privacy Policy. 
              Your email address will be used to notify you if you win and to send you promotional communications 
              about FiltersFast products and offers. You may unsubscribe from these communications at any time.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">LIMITATION OF LIABILITY</h2>
            <p className="text-gray-700 leading-relaxed">
              By entering, each entrant releases and agrees to hold FiltersFast.com, its affiliates, subsidiaries, 
              agents and licensees, the successors of each of the foregoing, and the directors, officers and employees 
              of all of the foregoing, harmless from and against any and all claims and liability arising out of the 
              entrant's participation in the Sweepstakes, the operation of the Sweepstakes, the acceptance or use of 
              a prize or the use of the entrant's name, biographical information and/or likeness as permitted hereunder, 
              including without limitation any and all claims and liabilities (i) relating to any personal injury, 
              death or property damage or loss sustained by any entrant or any other person or (ii) based upon any 
              allegation of violation of the right of privacy or right of publicity, misappropriation or violation of 
              any other personal or proprietary right. Entrants assume all liability for any injury or damage caused, 
              or claimed to be caused, by participation in this Sweepstakes or use or redemption of any prize. 
              FiltersFast.com is not responsible for any error in the notification of the offer, administration of 
              the Sweepstakes, or in the announcement of the prize.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
              <h3 className="font-semibold text-blue-900 mb-2">Questions?</h3>
              <p className="text-blue-800">
                For questions regarding FiltersFast giveaways and sweepstakes, please contact us at{' '}
                <a href="mailto:support@filtersfast.com" className="text-blue-600 hover:underline font-medium">
                  support@filtersfast.com
                </a>
              </p>
            </div>

            <div className="text-center mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-600 mb-4">Ready to enter?</p>
              <Link href="/giveaway">
                <button className="btn-primary">
                  View Active Giveaways
                </button>
              </Link>
            </div>

            <div className="text-center mt-8 text-sm text-gray-500">
              <p>© {new Date().getFullYear()} FiltersFast. All rights reserved.</p>
              <p className="mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

