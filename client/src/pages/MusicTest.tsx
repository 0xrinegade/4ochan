import React from 'react';
import { MarkdownContent } from '../components/MarkdownContent';

// Sample MusicXML content - "Hello, World!" in simple notation
const sampleMusicXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
        <lyric>
          <syllabic>single</syllabic>
          <text>Hel</text>
        </lyric>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
        <lyric>
          <syllabic>single</syllabic>
          <text>lo,</text>
        </lyric>
      </note>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
        <lyric>
          <syllabic>single</syllabic>
          <text>World</text>
        </lyric>
      </note>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
        <lyric>
          <syllabic>single</syllabic>
          <text>!</text>
        </lyric>
      </note>
    </measure>
  </part>
</score-partwise>`;

const MusicTest: React.FC = () => {
  return (
    <div className="music-test-page">
      <h1 className="text-2xl font-bold mb-6">Music Notation Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Using Markdown Code Block</h2>
        <p className="mb-4">
          The code block below uses language 'musicxml' to render sheet music:
        </p>
        <MarkdownContent content={`
\`\`\`musicxml
${sampleMusicXML}
\`\`\`
`} />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Example Usage in Posts</h2>
        <p className="mb-4">
          To share music notations in your posts, simply create a code block with the language set to 'musicxml' or 'music':
        </p>
        <pre className="p-4 bg-muted rounded-md overflow-x-auto">
{`\`\`\`musicxml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise>
  <!-- Your MusicXML content here -->
</score-partwise>
\`\`\``}
        </pre>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Resources for Creating MusicXML</h2>
        <p className="mb-4">You can create MusicXML files using various music notation software:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><a href="https://musescore.org/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">MuseScore</a> - Free and open-source music notation software</li>
          <li><a href="https://www.noteflight.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Noteflight</a> - Online music notation editor with MusicXML export</li>
          <li><a href="https://flat.io/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Flat.io</a> - Collaborative music notation editor</li>
          <li><a href="https://www.finalemusic.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Finale</a> - Professional music notation software</li>
          <li><a href="https://www.steinberg.net/dorico/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Dorico</a> - Modern music notation software</li>
        </ul>
      </div>
    </div>
  );
};

export default MusicTest;