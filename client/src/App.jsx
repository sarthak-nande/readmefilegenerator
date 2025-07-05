import React, { useState } from 'react';
import axios from "axios";
import { Github, Zap, FileText, Cpu, Eye, Copy, CheckCircle, Edit3, Plus, GripVertical, X, Save, RotateCcw, ExternalLink } from 'lucide-react';

const App = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorRepoUrl, setEditorRepoUrl] = useState('');
  const [readmeSections, setReadmeSections] = useState([]);
  const [draggedSection, setDraggedSection] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleGenerate = async () => {
  if (!repoUrl.trim()) {
    setError('Please enter a valid GitHub repository URL');
    return;
  }

  setIsLoading(true);
  setError('');
  setGeneratedReadme('');
  setReadmeSections([]);

  try {
    // Call your backend API
    const response = await axios.post("https://readmefilegenerator.onrender.com/api/generate", {
      link: repoUrl
    });

    // Expecting: { success: true, data: [...] }
    const result = response.data;

    if (result.success && Array.isArray(result.data)) {
      setReadmeSections(result.data);
      setEditorRepoUrl(repoUrl);
      setShowEditor(true);
    } else {
      setError('Invalid response format from backend.');
    }

    // Optional delay for UX loading state
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (err) {
    console.error(err);
    setError('Failed to generate README. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


  const regenerateReadme = async () => {
    if (!editorRepoUrl.trim()) return;
    
    setIsRegenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Mock regeneration with slight changes
      const newSections = [...readmeSections];
      newSections[1].content = 'Updated: This is an enhanced AI-generated README with improved documentation based on deeper code analysis.';
      setReadmeSections(newSections);
    } catch (err) {
      console.error('Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  };

  const addCustomSection = (type) => {
    const newSection = {
      id: Date.now().toString(),
      type: type,
      title: 'Custom Section',
      content: type === 'list' ? ['Item 1', 'Item 2'] : 'Your custom content here',
      ...(type === 'code' && { language: 'bash' })
    };
    setReadmeSections([...readmeSections, newSection]);
  };

  const updateSection = (id, updates) => {
    setReadmeSections(sections => 
      sections.map(section => 
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  const deleteSection = (id) => {
    setReadmeSections(sections => sections.filter(section => section.id !== id));
  };

  const handleDragStart = (e, index) => {
    setDraggedSection(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedSection === null) return;
    
    const newSections = [...readmeSections];
    const draggedItem = newSections[draggedSection];
    
    newSections.splice(draggedSection, 1);
    newSections.splice(dropIndex, 0, draggedItem);
    
    setReadmeSections(newSections);
    setDraggedSection(null);
  };

  const generateFinalReadme = () => {
    return readmeSections.map(section => {
      switch (section.type) {
        case 'heading':
          return `${'#'.repeat(section.level)} ${section.content}`;
        case 'paragraph':
          return section.title ? `## ${section.title}\n\n${section.content}` : section.content;
        case 'list':
          const listItems = section.content.map(item => `- ${item}`).join('\n');
          return section.title ? `## ${section.title}\n\n${listItems}` : listItems;
        case 'code':
          return section.title ? `## ${section.title}\n\n\`\`\`${section.language}\n${section.content}\n\`\`\`` : `\`\`\`${section.language}\n${section.content}\n\`\`\``;
        default:
          return section.content;
      }
    }).join('\n\n');
  };

  const copyToClipboard = async () => {
    const finalReadme = generateFinalReadme();
    try {
      await navigator.clipboard.writeText(finalReadme);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard');
    }
  };

  const SectionEditor = ({ section, index }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    return (
      <div 
        className="bg-slate-700/50 border border-purple-600/30 rounded-lg p-4 mb-4 group hover:border-purple-500/50 transition-colors"
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-4 w-4 text-purple-400 cursor-move" />
            <span className="text-sm font-medium text-purple-300 capitalize">{section.type}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => deleteSection(section.id)}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            {section.title !== undefined && (
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-600 border border-purple-600/30 rounded text-white text-sm"
                placeholder="Section title"
              />
            )}
            {section.type === 'list' ? (
              <div>
                {section.content.map((item, i) => (
                  <input
                    key={i}
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newContent = [...section.content];
                      newContent[i] = e.target.value;
                      updateSection(section.id, { content: newContent });
                    }}
                    className="w-full px-3 py-2 bg-slate-600 border border-purple-600/30 rounded text-white text-sm mb-1"
                    placeholder={`Item ${i + 1}`}
                  />
                ))}
                <button
                  onClick={() => updateSection(section.id, { content: [...section.content, 'New item'] })}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  + Add item
                </button>
              </div>
            ) : (
              <textarea
                value={section.content}
                onChange={(e) => updateSection(section.id, { content: e.target.value })}
                className="w-full px-3 py-2 bg-slate-600 border border-purple-600/30 rounded text-white text-sm h-20 resize-none"
                placeholder="Content"
              />
            )}
            {section.type === 'code' && (
              <input
                type="text"
                value={section.language}
                onChange={(e) => updateSection(section.id, { language: e.target.value })}
                className="w-full px-3 py-2 bg-slate-600 border border-purple-600/30 rounded text-white text-sm"
                placeholder="Language (e.g., bash, javascript)"
              />
            )}
          </div>
        ) : (
          <div className="text-purple-100 text-sm">
            {section.title && <div className="font-medium mb-1">{section.title}</div>}
            <div className="text-purple-200 truncate">
              {section.type === 'list' ? section.content.join(', ') : section.content}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Github className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">README Generator</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-purple-300">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">Powered by AI</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Generate Perfect READMEs
          </h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-8">
            Transform your GitHub repositories with AI-powered documentation. Our intelligent system analyzes your code and creates comprehensive, professional README files instantly.
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-purple-800/30">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Github className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">1. Clone Repository</h4>
              <p className="text-purple-200">We securely clone your GitHub repository to analyze the codebase</p>
            </div>
            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-purple-800/30">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">2. AI Analysis</h4>
              <p className="text-purple-200">Our AI reads and understands your code structure, dependencies, and purpose</p>
            </div>
            <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-purple-800/30">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">3. Generate README</h4>
              <p className="text-purple-200">Get a professional, comprehensive README.md file tailored to your project</p>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-800/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-purple-400" />
              Generate README
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full px-4 py-3 bg-slate-700 border border-purple-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    <span>Generate README</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-purple-800/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Eye className="h-5 w-5 mr-2 text-purple-400" />
                README Preview
              </h3>
            </div>

            <div className="h-96 bg-slate-900/50 rounded-lg border border-purple-800/20 overflow-y-auto">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-purple-300">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mb-4"></div>
                  <p className="text-center mb-2">Analyzing your repository...</p>
                  <p className="text-sm text-purple-400 text-center">
                    This may take a few moments while we read through your code
                  </p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-purple-400">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Your generated README will appear here</p>
                    <p className="text-sm mt-2">Click generate to create a professional README</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* README Editor Modal */}
        {showEditor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl border border-purple-800/30 w-full max-w-7xl h-5/6 flex flex-col">
              {/* Editor Header */}
              <div className="flex items-center justify-between p-6 border-b border-purple-800/30">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-white">README Editor</h2>
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-purple-300">Enhanced Editing Mode</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Editor Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Side - Controls */}
                <div className="w-1/2 p-6 border-r border-purple-800/30 overflow-y-auto">
                  {/* Regenerate Section */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="url"
                        value={editorRepoUrl}
                        onChange={(e) => setEditorRepoUrl(e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="flex-1 px-3 py-2 bg-slate-700 border border-purple-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={regenerateReadme}
                        disabled={isRegenerating}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        {isRegenerating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Section Buttons */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Add Custom Sections</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addCustomSection('paragraph')}
                        className="bg-slate-700 hover:bg-slate-600 text-purple-300 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Paragraph</span>
                      </button>
                      <button
                        onClick={() => addCustomSection('list')}
                        className="bg-slate-700 hover:bg-slate-600 text-purple-300 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>List</span>
                      </button>
                      <button
                        onClick={() => addCustomSection('code')}
                        className="bg-slate-700 hover:bg-slate-600 text-purple-300 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Code Block</span>
                      </button>
                      <button
                        onClick={() => addCustomSection('heading')}
                        className="bg-slate-700 hover:bg-slate-600 text-purple-300 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Heading</span>
                      </button>
                    </div>
                  </div>

                  {/* Sections List */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">README Sections</h3>
                    <div className="space-y-2">
                      {readmeSections.map((section, index) => (
                        <SectionEditor key={section.id} section={section} index={index} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side - Preview */}
                <div className="w-1/2 p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors">
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg border border-purple-800/20 p-4">
                    <pre className="text-sm text-purple-100 whitespace-pre-wrap font-mono leading-relaxed">
                      {generateFinalReadme()}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">Why Choose Our Generator?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/30 p-6 rounded-xl border border-purple-800/20">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Lightning Fast</h4>
              <p className="text-purple-200 text-sm">Generate comprehensive READMEs in seconds, not hours</p>
            </div>
            <div className="bg-slate-800/30 p-6 rounded-xl border border-purple-800/20">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <Cpu className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">AI-Powered</h4>
              <p className="text-purple-200 text-sm">Advanced AI understands your code and creates relevant documentation</p>
            </div>
            <div className="bg-slate-800/30 p-6 rounded-xl border border-purple-800/20">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Professional Quality</h4>
              <p className="text-purple-200 text-sm">Get README files that follow best practices and industry standards</p>
            </div>
            <div className="bg-slate-800/30 p-6 rounded-xl border border-purple-800/20">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <Github className="h-5 w-5 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">GitHub Ready</h4>
              <p className="text-purple-200 text-sm">Perfectly formatted for GitHub with proper markdown syntax</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;