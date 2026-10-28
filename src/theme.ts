export const colors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F2EEE8',
  text: '#1F1D1A',
  textMuted: '#6E6A64',
  border: '#E4DFD8',
  primary: '#5B5BD6',
  primarySoft: '#ECECFB',
  primaryText: '#FFFFFF',
  danger: '#D14343',
  dangerSoft: '#FBEAEA',
  warning: '#A86A00',
  warningSoft: '#FFF3DC',
  success: '#2F7D4F',
  successSoft: '#E5F4EA',
  highlight: '#FFF1B8',
  disabled: '#C9C4BC',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 8, md: 12, pill: 999 };

// 디자이너 시안(2차)의 웜톤 팔레트와 글꼴. 지금은 시작·로그인·회원가입·홈·캘린더가 쓴다 — 다른 화면은 시안이 나오면 옮긴다
export const warm = {
  background: '#F5F1EA',
  field: '#FDF9F5', // 입력칸 바탕, 진한 버튼 위 글자
  sand: '#D7C9B8',
  tan: '#B2967D', // 주 버튼, 보조 글자
  brown: '#7D5A44', // 링크, 그림자 색
  ink: '#4A342A', // 입력한 글자
  black: '#000000', // 로고·제목
  placeholder: 'rgba(178,150,125,0.7)',
  clay: '#C98A62', // 일정 점, 작성 중 표시
  sunday: '#C65A4E', // 캘린더 일요일 (빨강을 웜톤으로 누름)
  saturday: '#5E7DAE', // 캘린더 토요일
  soft: 'rgba(215,201,184,0.45)', // 고른 날·켜진 버튼 바탕
};

// assets/fonts의 Pretendard (OFL). 루트 레이아웃에서 불러온다 — Pretendard Std는 한글이 없어 쓰지 않는다
export const fonts = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};
