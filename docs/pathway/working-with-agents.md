---
last_reviewed: 2026-07-13
---

# Module 7: Working with Agents

**Optional, for when the basics feel comfortable · about 12 minutes · CGEA competency domains: Working with AI, Critical Appraisal of AI Outputs**

## What you will be able to do

- Explain what makes an agent different from a chat assistant, in one sentence.
- Read a permission prompt and decide, deliberately, whether to approve it.
- Recognize the tasks where an agent is the right tool and the ones where chat is.
- Keep the safety rules intact when an AI can touch your files.

## The core idea

A chat assistant answers you; an agent works for you. The difference is the loop: an agent can act (read a file, run a command, write a document), check its own result, and continue, repeating until the task is done. That loop lets an agent run checks and hand you *evidence* that the work was completed, not just text that looks right. Those checks improve reliability, but they are the agent grading its own work: they do not replace your review. The loop is also why agents come with a control chat never needed: your permission.

**Tool calls, and why you are the gate.** When an agent needs something done in the world, it pauses and asks: may I read this file, may I run this command, may I write this document. The interface executes the action only after the request passes a permission check, and in the default permission modes that check is you for anything consequential. Some settings auto-approve certain actions; [Your First Agent Session](../tools/first-session.md#the-settings-that-matter) covers which, and when they are earned. This is the module's one habit to build: **read the request before approving it.** A request that matches what you asked for gets a yes; a request that surprises you gets a no and a question. The permission prompt is not a formality to click through; it is the mechanism that makes a powerful tool safe, and it is enforced by the software, not by the model's good intentions.

<figure class="figure">
<svg viewBox="0 0 660 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="An agent proposes an action, you approve or deny at the gate, and only approved actions reach your machine">
<text x="330" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">you are the gate</text>
<rect x="30" y="60" width="160" height="64" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2"/>
<text x="110" y="86" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">the agent proposes</text>
<text x="110" y="104" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">"may I write this file?"</text>
<rect x="255" y="52" width="150" height="80" rx="40" fill="none" stroke="#ff8f00" stroke-width="2.5"/>
<text x="330" y="86" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">you decide</text>
<text x="330" y="104" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">does this match my request?</text>
<rect x="470" y="60" width="160" height="64" rx="8" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="550" y="86" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">the action runs</text>
<text x="550" y="104" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">only what you approved</text>
<defs><marker id="wa-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-default-fg-color--light)"/></marker></defs>
<line x1="190" y1="92" x2="253" y2="92" stroke="var(--md-default-fg-color--light)" stroke-width="1.6" marker-end="url(#wa-ar)"/>
<line x1="405" y1="92" x2="468" y2="92" stroke="var(--md-default-fg-color--light)" stroke-width="1.6" marker-end="url(#wa-ar)"/>
<text x="437" y="84" text-anchor="middle" font-size="8.5" fill="#2e7d32">approve</text>
<path d="M 330 132 L 330 168 L 110 168 L 110 126" fill="none" stroke="#c62828" stroke-width="1.6" marker-end="url(#wa-ar)"/>
<text x="220" y="161" text-anchor="middle" font-size="8.5" fill="#c62828">deny, and ask the agent why it wanted that</text>
<text x="330" y="198" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">the gate is enforced by the interface software, not by the model's judgment</text>
</svg>
<figcaption>Approve what matches your request; deny what surprises you. That one habit is most of agent safety.</figcaption>
</figure>

**When an agent beats chat.** The heavier and more file-bound the task, the more an agent wins. Chat is right for questions, drafts, and thinking; an agent is right when the work lives in files (a folder of readings to summarize, a document to revise consistently, data to reorganize), when it has many steps, or when it should be checked before you see it. There is an economic reason too: an agent writes a small script and lets your computer do mechanical work in seconds, where a chat interface would regenerate every word as paid output. If you have ever pasted a whole document into a chat window, an agent is the tool you were missing.

**Setups that persist.** Agents and assistants can both hold standing context so you stop re-explaining your job: a project per course with your syllabus attached, or a brief file in a folder the agent works in. One heuristic carries the whole idea: when the tool makes the same mistake twice, or you type the same correction twice, that correction belongs in the standing setup.

**The safety floor does not move.** Everything from [Module 3](rules.md) applies with more force, because an agent can read every file in the folder you open for it. Open the folder the task needs, never your whole disk; a folder containing student records is a folder an agent should not work in. Start any new kind of task on copies, not originals. And keep the verification habit that runs through this whole pathway: an agent saying a task is complete is a claim, and you open the result and look, the same way you check a citation.

## Self-check

??? question "You asked an agent to summarize the PDFs in a folder, and it asks permission to run a command that installs software. Approve?"
    Not on that information alone. The request does not obviously match the task, so it gets a no and a question first. Often there is a good reason (a missing PDF-reading tool it needs, which it will name), and after the explanation you may approve it deliberately. The habit being tested is reading the prompt rather than reflexively clicking yes.

??? question "An agent would save you an hour on a task involving a folder that contains, among other files, a spreadsheet of student grades. What is the move?"
    Move the files the task actually needs into a fresh folder and open that instead. The agent can read anything in the folder you grant, so the grant is the decision that matters; a protected record in scope is a data-rules problem even if the agent never happens to open it.

??? question "The agent reports the task finished successfully. Why open the output yourself anyway?"
    Because "finished" is the agent's claim about its own work, and the pathway's rule for AI claims does not change when the AI can run tools: verify before you rely. Agents make checking cheap (the file is right there), and the two minutes of looking is what makes delegating to one responsible rather than hopeful.

## Going deeper

- [Choosing Your Interface](../tools/interfaces.md): the full comparison of chat, working sessions, and agents, including the economics.
- [Your First Agent Session](../tools/first-session.md): the 20-minute hands-on walkthrough, including the settings worth changing.
- [Standing Setups](../tools/standing-setups.md): projects, instructions, and folder briefs that persist.

**Next:** [Your First Agent Session](../tools/first-session.md) puts this module into practice in 20 minutes.
