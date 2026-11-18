import React, { useState } from 'react';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../data/androidSourceFiles';
import {
  Copy,
  Check,
  Terminal,
  FileCode,
  Folder,
  Play,
  CheckCircle,
  GitBranch,
  Github,
  ShieldCheck,
  Package,
  Mail,
} from 'lucide-react';

export const AndroidStudioCodeViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'github' | 'code'>('github');
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_PROJECT_FILES[0]); // build-apk.yml
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedGitCmds, setCopiedGitCmds] = useState<boolean>(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildSuccess, setBuildSuccess] = useState<boolean>(false);

  const [githubUser, setGithubUser] = useState<string>('narendramaurya');
  const [repoName, setRepoName] = useState<string>('narendra-app-cloner');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gitCommandsText = `# Step 1: Initialize Git in your project folder
git init

# Step 2: Add all files & commit
git add .
git commit -m "Initial release: Narendra App Cloner Native Android"

# Step 3: Set main branch
git branch -M main

# Step 4: Link your GitHub repository
git remote add origin https://github.com/${githubUser.trim() || 'YOUR_USERNAME'}/${repoName.trim() || 'narendra-app-cloner'}.git

# Step 5: Push to GitHub (This triggers automated APK build!)
git push -u origin main`;

  const handleCopyGitCmds = () => {
    navigator.clipboard.writeText(gitCommandsText);
    setCopiedGitCmds(true);
    setTimeout(() => setCopiedGitCmds(false), 2500);
  };

  const handleSimulateBuild = () => {
    setIsBuilding(true);
    setBuildSuccess(false);
    setBuildLogs([
      '> Starting GitHub Actions runner on Ubuntu 22.04 LTS...',
      '> Setting up JDK 17 (Temurin)...',
      '> Setting up Android SDK Platform 34...',
      '> Preparing Gradle 8.4 Daemon...',
      '> Compiling Narendra App Cloner Kotlin sources (Target: JVM 17)...',
      '> Linking VirtualSandboxEngine, WorkProfileCloner, and SecurityVaultManager...',
      '> Validating AndroidManifest.xml permissions and Work Profile policies...',
      '> Running ProGuard / R8 bytecode optimization...',
      '> Signing debug APK with auto-generated SHA-256 test key...',
    ]);

    setTimeout(() => {
      setBuildLogs((prev) => [
        ...prev,
        '> BUILD SUCCESSFUL in 4.12s',
        '> Artifact Created: app/build/outputs/apk/debug/app-debug.apk (14.2 MB)',
        '> Available under GitHub Actions "Artifacts" tab.',
      ]);
      setIsBuilding(false);
      setBuildSuccess(true);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-purple-950/70 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider font-mono">
              GitHub Actions CI/CD &amp; Android Studio
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-purple-400">By Narendra Maurya</span>
            <span className="text-xs text-slate-500">·</span>
            <a
              href="mailto:narendramauryagkp@gmail.com"
              className="text-xs text-blue-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Mail className="h-3 w-3 text-purple-400" />
              <span>narendramauryagkp@gmail.com</span>
            </a>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            GitHub Se APK Banaye (Cloud Automated Build)
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Bina PC me Android Studio install kiye, GitHub Actions ke zariye directly cloud par Android APK build karein aur Source Code Explorer me sabhi files dekhein.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleSimulateBuild}
            disabled={isBuilding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Play className={`h-4 w-4 ${isBuilding ? 'animate-spin' : ''}`} />
            <span>{isBuilding ? 'Building APK...' : 'Test GitHub Build'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: GitHub Guide vs Source Code Explorer */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('github')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSubTab === 'github'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Github className="h-4 w-4" />
          <span>GitHub Actions Step-by-Step Guide</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeSubTab === 'code'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Source Code Explorer ({ANDROID_PROJECT_FILES.length} Files)</span>
        </button>
      </div>

      {/* Terminal / Build Log Viewer */}
      {buildLogs.length > 0 && (
        <div className="p-4 rounded-xl bg-black border border-slate-800 font-mono text-xs text-emerald-400 space-y-1 overflow-x-auto shadow-inner">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-900 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              <span>GitHub Actions Cloud Runner Console Output</span>
            </span>
            {buildSuccess && (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>BUILD PASSED · APK READY IN ARTIFACTS</span>
              </span>
            )}
          </div>
          {buildLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 1: GITHUB ACTIONS STEP-BY-STEP GUIDE */}
      {activeSubTab === 'github' && (
        <div className="space-y-6">
          
          {/* 4 Step Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center font-mono">
                    1
                  </span>
                  <Github className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-xs font-bold text-white">GitHub Repo Banaye</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  GitHub.com par login karein aur ek nayi repository banaye (e.g. <code className="text-blue-300">narendra-app-cloner</code>, Public ya Private).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                github.com/new
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600/20 text-purple-400 text-xs font-bold flex items-center justify-center font-mono">
                    2
                  </span>
                  <FileCode className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-xs font-bold text-white">Code Push ya Copy Karein</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  <strong className="text-white">Source Code Explorer</strong> se files copy karein ya neeche diye Git commands se GitHub me push karein.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                git push origin main
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold flex items-center justify-center font-mono">
                    3
                  </span>
                  <Play className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-xs font-bold text-white">GitHub Actions Run Hoga</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Repository ke <strong>Actions</strong> tab me jaakar dekhein. <code className="text-purple-300">build-apk.yml</code> workflow automatic run hoga.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                Ubuntu Cloud Runner
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600/20 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                    4
                  </span>
                  <Package className="h-4 w-4 text-slate-500" />
                </div>
                <h4 className="text-xs font-bold text-white">APK Artifact Tayyar</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Build complete hone ke baad GitHub run page ke neeche <strong>Artifacts</strong> section me <code className="text-emerald-400">NarendraAppCloner-APK</code> mil jayega!
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                app-debug.apk
              </div>
            </div>

          </div>

          {/* Interactive Git Commands Box */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-purple-400" />
                  <span>Terminal / Command Prompt Se Push Karne Ke Commands</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Apne GitHub Username aur Repo ka naam daalein, commands automatically generate ho jayenge:
                </p>
              </div>

              <button
                onClick={handleCopyGitCmds}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                {copiedGitCmds ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedGitCmds ? 'Commands Copied!' : 'Copy All Commands'}</span>
              </button>
            </div>

            {/* Inputs for Repo config */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  GitHub Username:
                </label>
                <input
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                  placeholder="e.g. narendramauryagkp"
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Repository Name:
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g. narendra-app-cloner"
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Code block */}
            <div className="relative rounded-xl bg-black border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              <pre className="whitespace-pre">
                <code>{gitCommandsText}</code>
              </pre>
            </div>
          </div>

          {/* GitHub Actions Workflow Details */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-blue-400" />
                  <span>Workflow File Path: .github/workflows/build-apk.yml</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Yeh file aapke project me already shaamil hai. Jab bhi aap push karenge ya Actions tab me &quot;Run workflow&quot; dabayenge, APK ban jayega.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedFile(ANDROID_PROJECT_FILES[0]);
                    setActiveSubTab('code');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  Inspect Code
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200 space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>GitHub Actions Build Highlights:</span>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px]">
                <li>Ubuntu 22.04 LTS cloud machine par JDK 17 aur Android SDK 34 automatically install hota hai.</li>
                <li>Gradle 8.4 cache automatically manage hoti hai, jisse build sirf 2–3 minute me complete hota hai.</li>
                <li>Build successful hone par <strong className="text-white">NarendraAppCloner-APK</strong> artifact 30 dino tak GitHub par uplabdh rehta hai.</li>
                <li>Aap seedhe phone ke browser se GitHub.com open karke APK build status dekh sakte hain!</li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: SOURCE CODE EXPLORER */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl">
          
          {/* Left Sidebar: File Tree */}
          <div className="md:col-span-4 border-r border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="h-4 w-4 text-purple-400" />
                <span>Project Files</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {ANDROID_PROJECT_FILES.length} files
              </span>
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {ANDROID_PROJECT_FILES.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-purple-950/60 border border-purple-500/60 text-white'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className={`h-4 w-4 shrink-0 mt-0.5 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{file.path}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Editor: Code Content */}
          <div className="md:col-span-8 flex flex-col h-[580px] bg-slate-950">
            
            {/* File Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-purple-300 font-bold">{selectedFile.path}</span>
                <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-800">
                  {selectedFile.language}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800/80 text-[11px] text-slate-400">
              {selectedFile.description}
            </div>

            {/* Code Viewer Container */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed bg-black/60 selection:bg-purple-900 selection:text-white">
              <pre className="whitespace-pre">
                <code>{selectedFile.content}</code>
              </pre>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
