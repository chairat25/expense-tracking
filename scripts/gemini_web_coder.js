// ==============================================================================
// Gemini Web Coder - Bridge between Agent and Gemini Web (gemini.google.com)
// Reused & adapted from: bloody-roar3000/art-source/gemini_performance_runner.js
// ==============================================================================

const { execSync } = require('child_process');
const fs = require('fs');

const CONFIG = {
  TIMEOUT_SECONDS: 180,       // รอการตอบกลับสูงสุด 3 นาที
  POLL_INTERVAL_MS: 3000,     // เช็กสถานะทุก 3 วินาที
  APPLESCRIPT_TIMEOUT_MS: 30000
};

/**
 * ค้นหาแท็บ Gemini ใน Chrome และรัน JavaScript
 */
function runChromeJS(code) {
  const escaped = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const appleScript = `
tell application "Google Chrome"
    repeat with w in windows
        repeat with t in tabs of w
            if (URL of t) starts with "https://gemini.google.com" then
                return execute t javascript "${escaped}"
            end if
        end repeat
    end repeat
    error "GEMINI_TAB_NOT_FOUND"
end tell
  `;
  try {
    const res = execSync('osascript', {
      input: appleScript,
      encoding: 'utf-8',
      timeout: CONFIG.APPLESCRIPT_TIMEOUT_MS
    });
    return res.trim();
  } catch (err) {
    const errMsg = (err.stderr ? err.stderr.toString() : '') + ' ' + (err.message || '');
    if (errMsg.includes('Allow JavaScript from Apple Events') || errMsg.includes('turned off')) {
      throw new Error("ยังไม่ได้เปิดสิทธิ์ใน Google Chrome: ไปที่เมนู View > Developer > Allow JavaScript from Apple Events");
    }
    if (errMsg.includes('GEMINI_TAB_NOT_FOUND')) {
      throw new Error("ไม่พบแท็บ https://gemini.google.com เปิดอยู่ใน Google Chrome");
    }
    throw err;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * ส่ง Prompt และรอรับ Code blocks + คำตอบจาก Gemini Web
 */
async function askGeminiWeb(promptText) {
  console.log(`[Gemini Web] ตรวจสอบแท็บ Gemini ใน Google Chrome...`);
  
  // 1. เช็กความพร้อมและนับจำนวนข้อความเดิม
  const countCode = `(() => document.querySelectorAll("model-response-content, message-content").length)()`;
  const initialMsgCount = parseInt(runChromeJS(countCode) || "0", 10);
  console.log(`[Gemini Web] จำนวนข้อความเดิมในแชต: ${initialMsgCount}`);

  // 2. พิมพ์ Prompt ลงใน Editor
  console.log(`[Gemini Web] ส่ง Prompt เข้ากล่องข้อความ...`);
  const inputCode = `(() => {
    const editor = document.querySelector(".ql-editor");
    if (!editor) return "no_editor";
    editor.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, ${JSON.stringify(promptText)});
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
    editor.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
    editor.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));
    return "typed";
  })()`;
  
  const inputStatus = runChromeJS(inputCode);
  if (inputStatus !== "typed") {
    throw new Error(`ไม่สามารถพิมพ์ลงกล่องข้อความได้: ${inputStatus}`);
  }

  await sleep(1500);

  // 3. กดปุ่มส่งข้อความ (รองรับทั้งภาษาไทยและอังกฤษ)
  console.log(`[Gemini Web] กดปุ่มส่งข้อความ...`);
  const sendCode = `(() => {
    const btn = document.querySelector("button[aria-label*='ส่งข้อความ'], button[aria-label*='Send message'], button.send-button");
    if (btn) {
      btn.click();
      return "clicked";
    }
    return "btn_not_found";
  })()`;
  
  const sendStatus = runChromeJS(sendCode);
  if (sendStatus !== "clicked") {
    throw new Error(`ไม่พบปุ่มส่งข้อความบนหน้าเว็บ`);
  }

  // 4. รอการตอบกลับและตรวจสอบสถานะการ Stream โค้ด
  const startTime = Date.now();
  console.log(`[Gemini Web] กำลังรอผลลัพธ์จาก Gemini Web (จำกัดเวลา ${CONFIG.TIMEOUT_SECONDS}s)...`);

  while (true) {
    await sleep(CONFIG.POLL_INTERVAL_MS);
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);

    if (elapsedSec > CONFIG.TIMEOUT_SECONDS) {
      throw new Error(`หมดเวลา (${CONFIG.TIMEOUT_SECONDS}s) Gemini ยังเจนไม่เสร็จ`);
    }

    const pollCode = `(() => {
      const isGenerating = !!document.querySelector("button[aria-label*='หยุด'], button[aria-label*='Stop']");
      const modelContents = Array.from(document.querySelectorAll("model-response-content, message-content"));
      const currentCount = modelContents.length;

      if (currentCount > ${initialMsgCount} && !isGenerating) {
        const latest = modelContents[modelContents.length - 1];
        
        // ดึงโค้ดทุกบล็อกที่อยู่ในข้อความล่าสุด
        const codeElements = Array.from(latest.querySelectorAll("pre code, code-block, .code-container pre, pre"));
        const codeBlocks = codeElements.map(el => (el.innerText || el.textContent || "").trim()).filter(Boolean);

        const fullText = (latest.innerText || latest.textContent || "").trim();

        return JSON.stringify({
          done: true,
          fullText: fullText,
          codeBlocks: codeBlocks,
          count: currentCount
        });
      }
      return JSON.stringify({ done: false, isGenerating, count: currentCount });
    })()`;

    try {
      const result = JSON.parse(runChromeJS(pollCode) || "{}");
      if (result.done) {
        console.log(`[Gemini Web] ได้รับคำตอบสมบูรณ์ในเวลา ${elapsedSec} วินาที!`);
        return {
          fullText: result.fullText,
          codeBlocks: result.codeBlocks
        };
      }
      process.stdout.write(`\r[Gemini Web ${elapsedSec}s] กำลังประมวลผล (isGenerating: ${result.isGenerating})... `);
    } catch (err) {
      // ignore JSON parse or poll transient errors
    }
  }
}

// ใช้งานผ่าน Command Line: node scripts/gemini_web_coder.js "prompt"
if (require.main === module) {
  let promptArg = "";
  if (process.argv.includes("--prompt-file")) {
    const fileIdx = process.argv.indexOf("--prompt-file");
    const filePath = process.argv[fileIdx + 1];
    if (filePath && fs.existsSync(filePath)) {
      promptArg = fs.readFileSync(filePath, "utf-8").trim();
    } else {
      console.error(`[Error] File not found: ${filePath}`);
      process.exit(1);
    }
  } else {
    promptArg = process.argv.slice(2).join(" ").trim();
  }
  
  if (!promptArg) {
    console.log("Usage: node scripts/gemini_web_coder.js \"<prompt>\"");
    console.log("   or: node scripts/gemini_web_coder.js --test");
    process.exit(1);
  }

  if (promptArg === "--test") {
    try {
      const title = runChromeJS("(() => document.title)()");
      console.log(`[Test OK] เชื่อมต่อกับแท็บสำเร็จ: "${title}"`);
    } catch (err) {
      console.error(`[Test Failed] ${err.message}`);
    }
    process.exit(0);
  }

  askGeminiWeb(promptArg)
    .then(res => {
      console.log("\n==================== [GEMINI WEB RESPONSE] ====================");
      if (res.codeBlocks.length > 0) {
        console.log(`\nพบโค้ดทั้งหมด ${res.codeBlocks.length} บล็อก:\n`);
        res.codeBlocks.forEach((code, i) => {
          console.log(`--- [Code Block ${i + 1}] ---`);
          console.log(code);
        });
      } else {
        console.log("\nคำตอบทั้งหมด:\n");
        console.log(res.fullText);
      }
    })
    .catch(err => {
      console.error(`\n[Error] ${err.message}`);
      process.exit(1);
    });
}

module.exports = { askGeminiWeb, runChromeJS };
