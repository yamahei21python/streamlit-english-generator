import streamlit as st
import os
import re
import numpy as np
from gtts import gTTS
from pydub import AudioSegment
from moviepy.editor import *
from PIL import Image, ImageDraw, ImageFont
from janome.tokenizer import Tokenizer
import warnings
import shutil
import traceback
from tqdm import tqdm

# --- 0. Streamlitアプリの初期設定 ---
st.set_page_config(
    page_title="瞬間英作文ジェネレーター",
    page_icon="🇺🇸",
    layout="wide"
)

# --- 警告抑制 ---
warnings.filterwarnings('ignore', category=FutureWarning, module='moviepy.*')
warnings.filterwarnings('ignore', message="Couldn't find ffmpeg or avconv")

# --- グローバル設定 (動画・音声共通) ---
TEMP_DIR = "temp_streamlit_files"
# Streamlit Cloudでデプロイする場合、`packages.txt`に`fonts-ipafont-gothic`を追加してください。
FONT_PATH = "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf"

# フォントの存在確認と代替フォントの設定
if not os.path.exists(FONT_PATH):
    st.warning(f"指定フォント '{FONT_PATH}' が見つかりません。代替フォントを探します。")
    alt_font_path = "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf"
    if os.path.exists(alt_font_path):
        FONT_PATH = alt_font_path
        st.info(f"代替フォントを使用します: {FONT_PATH}")
    else:
        st.error("日本語フォントが見つかりません。テキストが正しく表示されない可能性があります。")
        FONT_PATH = None

# --- 2. ヘルパー関数定義 ---
@st.cache_resource
def get_janome_tokenizer():
    try:
        tokenizer = Tokenizer()
        st.success("Janomeトークナイザーの準備ができました。")
        return tokenizer, True
    except Exception as e:
        st.warning(f"Janomeトークナイザーの初期化に失敗しました: {e}\n簡易的な文字数での改行にフォールバックします。")
        return None, False

janome_tokenizer, janome_available = get_janome_tokenizer()

def cleanup_text(text):
    text = str(text) if text is not None else ""
    text = re.sub(r'[\(\)\[\]\{\}]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def wrap_text_japanese(text, font, max_width):
    if not text or not font: return ""
    getlength_available = hasattr(font, 'getlength') and callable(font.getlength)

    if not janome_available or not getlength_available:
        wrapped_lines = []
        estimated_char_width = font.size * 0.9 if font.size > 0 else 16
        max_chars_per_line = max(1, int(max_width / estimated_char_width) if estimated_char_width > 0 else 20)
        original_lines = text.split('\n')
        for line in original_lines:
            current_line = ""
            for char_val in line:
                if len(current_line) >= max_chars_per_line:
                    wrapped_lines.append(current_line)
                    current_line = char_val
                else:
                    current_line += char_val
            if current_line:
                wrapped_lines.append(current_line)
        return '\n'.join(wrapped_lines)

    try:
        lines = text.split('\n')
        wrapped_lines = []
        for line in lines:
            if not line.strip():
                wrapped_lines.append("")
                continue
            current_line = ""
            current_width = 0
            tokens = janome_tokenizer.tokenize(line)
            for token in tokens:
                word = token.surface
                if not word.strip(): continue
                word_width = font.getlength(word)
                if current_line and current_width + word_width > max_width:
                    wrapped_lines.append(current_line)
                    current_line = word
                    current_width = word_width
                else:
                    current_line += word
                    current_width += word_width
            if current_line:
                wrapped_lines.append(current_line)
        return '\n'.join(wrapped_lines)
    except Exception as e:
        print(f"警告: Janome改行処理中にエラー ({e})。簡易文字数改行にフォールバック。")
        return text

def wrap_text_by_space(text, font, max_width):
    if not text or not font: return ""
    getlength_available = hasattr(font, 'getlength') and callable(font.getlength)

    if not getlength_available:
        wrapped_lines = []
        estimated_char_width = font.size * 0.6 if font.size > 0 else 10
        max_chars_per_line = max(1, int(max_width / estimated_char_width) if estimated_char_width > 0 else 30)
        current_line = ""
        words = text.split(' ')
        for word in words:
            if not word: continue
            if not current_line:
                current_line = word
            elif len(current_line) + 1 + len(word) <= max_chars_per_line:
                current_line += " " + word
            else:
                wrapped_lines.append(current_line)
                current_line = word
        if current_line:
            wrapped_lines.append(current_line)
        return '\n'.join(wrapped_lines)

    wrapped_lines = []
    space_width = font.getlength(' ')
    original_lines = text.split('\n')
    for line in original_lines:
        words = line.split(' ')
        current_line = ""
        current_width = 0
        for i, word in enumerate(words):
            if not word: continue
            word_width = font.getlength(word)
            if not current_line or current_width + (space_width if current_line else 0) + word_width <= max_width:
                if current_line:
                    current_line += " "
                    current_width += space_width
                current_line += word
                current_width += word_width
            else:
                wrapped_lines.append(current_line)
                current_line = word
                current_width = word_width
        if current_line:
            wrapped_lines.append(current_line)
    return '\n'.join(wrapped_lines)

def create_text_frame(jp_text, en_text, font_path, font_size, width, height, bg_color, text_color, padding):
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    font = None
    try:
        font = ImageFont.truetype(font_path, font_size) if font_path and os.path.exists(font_path) else ImageFont.load_default()
    except Exception as e:
        print(f"警告: フォントロードエラー ({e})。")
        font = ImageFont.load_default()

    if font is None:
        print("エラー: フォントオブジェクトが作成できませんでした。")
        return img

    drawable_width = width - 2 * padding
    jp_wrapped = wrap_text_japanese(jp_text, font, drawable_width)
    en_wrapped = wrap_text_by_space(en_text, font, drawable_width)

    try:
        jp_y = padding
        en_y = height // 2 + padding // 2
        draw.text((padding, jp_y), jp_wrapped, font=font, fill=text_color, anchor="la")
        draw.text((padding, en_y), en_wrapped, font=font, fill=text_color, anchor="la")
    except Exception as e:
        print(f"警告: テキスト描画中にエラー ({e})。")

    return img

# --- 3. メイン処理関数 ---
def process_sentences(sentences_input, create_mp3, create_mp4, jp_reps_input, en_reps_input, progress_bar, status_text):
    generated_files = []
    try:
        status_text.text("処理を開始します...")
        progress_bar.progress(0)
        
        try:
            jp_reps = int(jp_reps_input)
            en_reps = int(en_reps_input)
            if jp_reps < 1 or en_reps < 1: raise ValueError("繰り返し回数は1以上である必要があります。")
        except ValueError as e:
            st.error(f"繰り返し回数の入力が無効です: {e}")
            return []
            
        if not create_mp3 and not create_mp4:
            st.warning("MP3作成とMP4作成の両方が選択されていません。")
            return []

        status_text.text("一時ディレクトリを準備中...")
        progress_bar.progress(5)
        if os.path.exists(TEMP_DIR):
            shutil.rmtree(TEMP_DIR)
        os.makedirs(TEMP_DIR, exist_ok=True)

        status_text.text("例文データを解析中...")
        progress_bar.progress(10)
        sentence_pairs = []
        sentences_raw = sentences_input.strip().split('\n')
        for i, sentence in enumerate(sentences_raw):
            parts = sentence.split(',', 1)
            if len(parts) == 2:
                japanese_text = cleanup_text(parts[0].strip())
                english_text = cleanup_text(parts[1].strip())
                if japanese_text and english_text:
                    sentence_pairs.append((japanese_text, english_text))

        if not sentence_pairs:
            st.error("有効な例文ペアが抽出できませんでした。入力形式「日本語,英語」を確認してください。")
            return []
        
        total_major_steps = (1 if create_mp3 else 0) + (1 if create_mp4 else 0)
        mp3_progress_share = 40 if create_mp3 else 0
        mp4_progress_share = 40 if create_mp4 else 0
        current_progress_offset = 10

        # --- MP3生成処理 ---
        if create_mp3:
            try:
                final_combined_audio = AudioSegment.empty()
                for i, (jp_text, en_text) in enumerate(sentence_pairs):
                    loop_prog = current_progress_offset + int(mp3_progress_share * ((i + 1) / len(sentence_pairs)))
                    status_text.text(f"MP3生成中: 例文 {i+1}/{len(sentence_pairs)}")
                    progress_bar.progress(loop_prog)
                    
                    entry_audio_combined = AudioSegment.empty()
                    jp_audio_once = AudioSegment.empty()
                    en_audio_once = AudioSegment.empty()
                    
                    temp_jp_file = os.path.join(TEMP_DIR, f"temp_mp3_jp_{i:03d}.mp3")
                    try:
                        tts_jp = gTTS(text=jp_text, lang='ja'); tts_jp.save(temp_jp_file)
                        jp_audio_once = AudioSegment.from_mp3(temp_jp_file)
                        os.remove(temp_jp_file)
                    except Exception as e: print(f"警告(MP3): 日本語 '{jp_text}' 音声生成失敗: {e}"); jp_audio_once = AudioSegment.silent(duration=500)
                    
                    temp_en_file = os.path.join(TEMP_DIR, f"temp_mp3_en_{i:03d}.mp3")
                    try:
                        tts_en = gTTS(text=en_text, lang='en'); tts_en.save(temp_en_file) # ★言語を 'en' に変更
                        en_audio_once = AudioSegment.from_mp3(temp_en_file)
                        os.remove(temp_en_file)
                    except Exception as e: print(f"警告(MP3): 英語 '{en_text}' 音声生成失敗: {e}"); en_audio_once = AudioSegment.silent(duration=500)

                    for _ in range(jp_reps):
                        entry_audio_combined += jp_audio_once + AudioSegment.silent(800)
                    entry_audio_combined += AudioSegment.silent(600)
                    for _ in range(en_reps):
                        entry_audio_combined += en_audio_once + AudioSegment.silent(800)
                    
                    final_combined_audio += entry_audio_combined + AudioSegment.silent(2000)

                status_text.text("MP3ファイル書き出し中...")
                progress_bar.progress(current_progress_offset + mp3_progress_share)
                output_mp3_path = os.path.join(TEMP_DIR, "output_audio.mp3")
                final_combined_audio.export(output_mp3_path, format="mp3")
                generated_files.append(output_mp3_path)
            except Exception as e_mp3:
                st.error(f"MP3生成中にエラーが発生しました: {str(e_mp3)}")
        
        current_progress_offset += mp3_progress_share

        # --- MP4生成処理 ---
        if create_mp4:
            try:
                VIDEO_WIDTH, VIDEO_HEIGHT, BG_COLOR, TEXT_COLOR, FPS, BASE_FONT_SIZE, PADDING = 1280, 720, (0,0,0), (255,255,255), 10, 45, 50
                PAUSE_BETWEEN_LANG, PAUSE_BETWEEN_REPS, PAUSE_BETWEEN_ENTRIES = 700, 900, 2500
                all_clips = []
                
                for i, (jp_text, en_text) in enumerate(sentence_pairs):
                    loop_prog = current_progress_offset + int(mp4_progress_share * ((i + 1) / len(sentence_pairs)))
                    status_text.text(f"MP4生成中: 例文 {i+1}/{len(sentence_pairs)}")
                    progress_bar.progress(loop_prog)

                    current_frame_pil = create_text_frame(jp_text, en_text, FONT_PATH, BASE_FONT_SIZE, VIDEO_WIDTH, VIDEO_HEIGHT, BG_COLOR, TEXT_COLOR, PADDING)
                    current_frame_np = np.array(current_frame_pil)
                    
                    jp_audio_clip, en_audio_clip = None, None
                    try:
                        jp_mp3 = os.path.join(TEMP_DIR, f"temp_mp4_jp_{i}.mp3")
                        gTTS(text=jp_text, lang='ja').save(jp_mp3)
                        jp_audio_clip = AudioFileClip(jp_mp3)
                    except Exception: pass
                    try:
                        en_mp3 = os.path.join(TEMP_DIR, f"temp_mp4_en_{i}.mp3")
                        gTTS(text=en_text, lang='en').save(en_mp3) # ★言語を 'en' に変更
                        en_audio_clip = AudioFileClip(en_mp3)
                    except Exception: pass

                    if jp_audio_clip:
                        for _ in range(jp_reps):
                            all_clips.append(ImageClip(current_frame_np).set_duration(jp_audio_clip.duration).set_audio(jp_audio_clip))
                            all_clips.append(ImageClip(current_frame_np).set_duration(PAUSE_BETWEEN_REPS / 1000))
                    
                    all_clips.append(ImageClip(current_frame_np).set_duration(PAUSE_BETWEEN_LANG / 1000))
                    
                    if en_audio_clip:
                        for _ in range(en_reps):
                            all_clips.append(ImageClip(current_frame_np).set_duration(en_audio_clip.duration).set_audio(en_audio_clip))
                            all_clips.append(ImageClip(current_frame_np).set_duration(PAUSE_BETWEEN_REPS / 1000))

                    if i < len(sentence_pairs) - 1:
                        all_clips.append(ImageClip(current_frame_np).set_duration(PAUSE_BETWEEN_ENTRIES / 1000))

                status_text.text("MP4ファイル結合・書き出し中...")
                progress_bar.progress(current_progress_offset + mp4_progress_share)

                if not all_clips:
                    st.warning("MP4用の動画クリップが作成できませんでした。")
                else:
                    output_mp4_path = os.path.join(TEMP_DIR, "output_video.mp4")
                    final_video = concatenate_videoclips(all_clips, method="compose")
                    final_video.write_videofile(
                        output_mp4_path, codec='libx264', audio_codec='aac', fps=FPS, logger=None
                    )
                    generated_files.append(output_mp4_path)
                    final_video.close()
                    for clip in all_clips:
                        if clip.audio: clip.audio.close()
            except Exception as e_mp4:
                st.error(f"MP4生成中にエラーが発生しました: {str(e_mp4)}")

        status_text.text("処理完了！")
        progress_bar.progress(100)
        return generated_files

    except Exception as e:
        st.error(f"予期せぬエラーが発生しました: {str(e)}")
        return []

# --- 4. Streamlitインターフェースの作成 ---
st.title("🇺🇸 瞬間英作文ジェネレーター 🇬🇧")
st.markdown(
    """
    日本語と英語の例文ペアを入力し、**MP3音声ファイル**または**テキスト付きMP4動画ファイル**を生成します。  
    例文は1行に「`日本語テキスト,英語テキスト`」の形式で入力してください（複数行可）。
    """
)
st.markdown("---")

if 'generated_files' not in st.session_state:
    st.session_state.generated_files = []

col1, col2 = st.columns([2, 1])

with col1:
    sentence_input_area = st.text_area(
        "例文入力",
        height=300,
        placeholder="例:\nこれはペンです,This is a pen.\n私は学生です,I am a student.",
        help="一行に「日本語,英語」のペアを入力します。複数行入力できます。"
    )

with col2:
    st.subheader("生成オプション")
    create_mp3_checkbox = st.checkbox("MP3音声ファイルを作成する", value=True)
    create_mp4_checkbox = st.checkbox("MP4動画ファイルを作成する", value=True)
    
    st.subheader("読み上げ回数")
    c1, c2 = st.columns(2)
    with c1:
        jp_reps_number = st.number_input("日本語", min_value=1, value=1, step=1, help="日本語の読み上げ回数")
    with c2:
        en_reps_number = st.number_input("英語", min_value=1, value=3, step=1, help="英語の読み上げ回数")

    st.markdown("")
    submit_button = st.button("変換実行", type="primary", use_container_width=True)

if submit_button:
    if not sentence_input_area.strip():
        st.warning("例文が入力されていません。")
    else:
        progress_bar = st.progress(0, text="処理待機中...")
        status_text = st.empty()
        
        with st.spinner('音声・動画ファイルを生成中です... しばらくお待ちください。'):
            files = process_sentences(
                sentences_input=sentence_input_area,
                create_mp3=create_mp3_checkbox,
                create_mp4=create_mp4_checkbox,
                jp_reps_input=jp_reps_number,
                en_reps_input=en_reps_number, # ★変数名を変更
                progress_bar=progress_bar,
                status_text=status_text
            )
            st.session_state.generated_files = files
        
        if st.session_state.generated_files:
            st.success("ファイルの生成が完了しました！")
        
        st.rerun()

if st.session_state.generated_files:
    st.markdown("---")
    st.header("生成されたファイル")
    
    for file_path in st.session_state.generated_files:
        try:
            with open(file_path, "rb") as f:
                file_bytes = f.read()
                file_name = os.path.basename(file_path)
                
                if file_path.endswith(".mp3"):
                    st.subheader("🎧 MP3 音声ファイル")
                    st.audio(file_bytes, format='audio/mp3')
                    st.download_button(
                        label=f"📥 {file_name} をダウンロード",
                        data=file_bytes,
                        file_name=file_name,
                        mime='audio/mp3',
                    )
                elif file_path.endswith(".mp4"):
                    st.subheader("🎬 MP4 動画ファイル")
                    st.video(file_bytes, format='video/mp4')
                    st.download_button(
                        label=f"📥 {file_name} をダウンロード",
                        data=file_bytes,
                        file_name=file_name,
                        mime='video/mp4',
                    )
        except FileNotFoundError:
            st.error(f"ファイルが見つかりません: {file_path}")
        except Exception as e:
            st.error(f"ファイルの表示中にエラーが発生しました: {e}")
