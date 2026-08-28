import type {
  PastedFile,
  PasteTextInputInstance as PasteInputRef,
} from '@mattermost/react-native-paste-input';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

import { LinkifiedTextarea } from '../LinkifiedTextarea';

const mockTrackEvent = jest.fn();
const mockAddAction = jest.fn();
const mockTrackError = jest.fn();
const mockUseLinkifyText = jest.fn(({ text }: { text: string }) => ({
  linkifiedText: text,
}));
const mockShouldHandleKeyboardEvents = { value: false };
const mockPasteInputRefHandle = {
  blur: jest.fn(),
  clear: jest.fn(),
  focus: jest.fn(),
  isFocused: jest.fn(() => false),
  setNativeProps: jest.fn(),
  setSelection: jest.fn(),
} as unknown as PasteInputRef;

jest.mock('@datadog/mobile-react-native', () => ({
  DdRum: { addAction: (...args: unknown[]) => mockAddAction(...args) },
  RumActionType: { CUSTOM: 'CUSTOM' },
}));

jest.mock('@mattermost/react-native-paste-input', () => {
  const ReactLib = require('react');
  const { TextInput } = require('react-native');

  return ReactLib.forwardRef(
    (props: { testID?: string }, ref: React.Ref<unknown>) => {
      ReactLib.useImperativeHandle(ref, () => mockPasteInputRefHandle);
      return ReactLib.createElement(TextInput, {
        ...props,
        testID: props.testID ?? 'paste-input',
      });
    },
  );
});

jest.mock('@gorhom/bottom-sheet', () => ({
  useBottomSheetInternal: () => ({
    shouldHandleKeyboardEvents: mockShouldHandleKeyboardEvents,
  }),
}));

jest.mock('react-native-reanimated', () => ({
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
}));

jest.mock(
  'farcaster-analytics',
  () => ({ AnalyticsEvent: { MiscPastedFile: 'MiscPastedFile' } }),
  { virtual: true },
);

jest.mock(
  'farcaster-expo',
  () => ({
    useUnfocusInputs: () => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
  }),
  { virtual: true },
);

jest.mock('~/components/Text', () => ({
  Text: require('react-native').Text,
}));
jest.mock('~/constants/Pressable', () => ({ hitSlop: 8 }));
jest.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => ({ trackEvent: mockTrackEvent }),
}));
jest.mock('~/contexts/ThemeProvider', () => ({
  useTheme: () => ({
    bgInput: {},
    roundedLg: {},
    flexShrink: {},
    flexGrow0: {},
    textCenter: {},
    textLeft: {},
    texts: { primary: {} },
    textLg: {},
    alignCenter: {},
    colors: { text: { tertiary: '#999' }, selection: '#123' },
  }),
}));
jest.mock('~/hooks/useLinkifyText', () => ({
  useLinkifyText: (args: { text: string }) => mockUseLinkifyText(args),
}));
jest.mock('~/utils/ErrorUtils', () => ({
  trackError: (...args: unknown[]) => mockTrackError(...args),
}));

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
};

describe('LinkifiedTextarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldHandleKeyboardEvents.value = false;
  });

  it('renders a controlled PasteInput on Android', () => {
    setPlatform('android');
    const onChangeText = jest.fn();
    const onSelectionChange = jest.fn();
    const selection = { start: 1, end: 4 };

    const { getByTestId } = render(
      <LinkifiedTextarea
        value="draft"
        selection={selection}
        onChangeText={onChangeText}
        onSelectionChange={onSelectionChange}
      />,
    );

    const input = getByTestId('paste-input');
    expect(input.props.value).toBe('draft');
    expect(input.props.children).toBeUndefined();
    expect(input.props.selection).toEqual(selection);
    expect(input.props.onSelectionChange).toBe(onSelectionChange);
    expect(mockUseLinkifyText).not.toHaveBeenCalled();

    fireEvent.changeText(input, 'updated');
    expect(onChangeText).toHaveBeenCalledWith('updated');

    const selectionChangeEvent = {
      nativeEvent: { selection: { start: 2, end: 5 } },
    };
    input.props.onSelectionChange(selectionChangeEvent);
    expect(onSelectionChange).toHaveBeenCalledWith(selectionChangeEvent);
  });

  it('preserves native input props, events, and the forwarded ref on iOS', () => {
    setPlatform('ios');
    const inputRef = React.createRef<PasteInputRef>();
    const onBlur = jest.fn();
    const onChangeText = jest.fn();
    const onFocus = jest.fn();
    const onKeyPress = jest.fn();
    const onSelectionChange = jest.fn();
    const onContentSizeChange = jest.fn();
    const onSubmitEditing = jest.fn();
    const selection = { start: 2, end: 7 };

    const { getByTestId } = render(
      <LinkifiedTextarea
        ref={inputRef}
        value="ios draft"
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onKeyPress={onKeyPress}
        onSelectionChange={onSelectionChange}
        onContentSizeChange={onContentSizeChange}
        onSubmitEditing={onSubmitEditing}
        selection={selection}
        keyboardType="email-address"
        returnKeyType="send"
        editable={false}
        placeholder="Write a cast"
        accessibilityLabel="Cast text"
        testID="caller-input"
      />,
    );

    const input = getByTestId('caller-input');
    expect(input.props).toEqual(
      expect.objectContaining({
        accessibilityLabel: 'Cast text',
        editable: false,
        keyboardType: 'email-address',
        multiline: true,
        placeholder: 'Write a cast',
        returnKeyType: 'send',
        selection,
        value: 'ios draft',
      }),
    );
    expect(input.props.children).toBeUndefined();
    expect(input.props.onBlur).toBe(onBlur);
    expect(input.props.onFocus).toBe(onFocus);
    expect(input.props.onKeyPress).toBe(onKeyPress);
    expect(input.props.onSelectionChange).toBe(onSelectionChange);
    expect(input.props.onContentSizeChange).toBe(onContentSizeChange);
    expect(input.props.onSubmitEditing).toBe(onSubmitEditing);
    input.props.onChangeText('updated iOS draft');
    expect(onChangeText).toHaveBeenCalledWith('updated iOS draft');
    const selectionChangeEvent = {
      nativeEvent: { selection: { start: 3, end: 8 } },
    };
    input.props.onSelectionChange(selectionChangeEvent);
    expect(onSelectionChange).toHaveBeenCalledWith(selectionChangeEvent);
    expect(inputRef.current).toBe(mockPasteInputRefHandle);
    expect(mockUseLinkifyText).not.toHaveBeenCalled();
  });

  it('forwards the exact extensionless image object from onPaste', async () => {
    setPlatform('android');
    const onImagePaste = jest.fn();
    const pastedImageFile: PastedFile = {
      fileName: 'clipboard-image',
      fileSize: 42,
      type: 'image/png',
      uri: 'content://clipboard/item',
    };
    const { getByTestId } = render(
      <LinkifiedTextarea onImagePaste={onImagePaste} />,
    );

    await getByTestId('paste-input').props.onPaste(undefined, [
      pastedImageFile,
    ]);

    expect(onImagePaste).toHaveBeenCalledTimes(1);
    expect(onImagePaste).toHaveBeenCalledWith({ pastedImageFile });
    expect(onImagePaste.mock.calls[0][0].pastedImageFile).toBe(pastedImageFile);
    expect(mockAddAction).toHaveBeenCalledWith(
      'CUSTOM',
      'PastedFile.LinkifiedTextarea.onPaste',
      {},
    );
    expect(mockTrackEvent).toHaveBeenCalledWith('MiscPastedFile', {
      source: 'LinkifiedTextarea',
    });
  });

  it('uses the real BottomSheetPasteInput keyboard and ref behavior', () => {
    setPlatform('android');
    const inputRef = React.createRef<PasteInputRef>();
    const onBlur = jest.fn();
    const onFocus = jest.fn();
    const { getByTestId } = render(
      <LinkifiedTextarea
        inBottomSheet
        ref={inputRef}
        value="sheet draft"
        onBlur={onBlur}
        onFocus={onFocus}
      />,
    );

    const input = getByTestId('paste-input');
    expect(input.props.value).toBe('sheet draft');
    expect(input.props.children).toBeUndefined();
    expect(inputRef.current).toBe(mockPasteInputRefHandle);

    const focusEvent = { nativeEvent: { target: 1 } };
    fireEvent(input, 'focus', focusEvent);
    expect(mockShouldHandleKeyboardEvents.value).toBe(true);
    expect(onFocus).toHaveBeenCalledWith(focusEvent);

    const blurEvent = { nativeEvent: { target: 1 } };
    fireEvent(input, 'blur', blurEvent);
    expect(mockShouldHandleKeyboardEvents.value).toBe(false);
    expect(onBlur).toHaveBeenCalledWith(blurEvent);
  });

  it.each([
    ['an empty paste', []],
    [
      'an explicit non-image',
      [
        {
          fileName: 'not-an-image',
          fileSize: 12,
          type: 'text/plain',
          uri: 'file:///tmp/photo.png',
        },
      ],
    ],
  ])('ignores %s without crashing', async (_label, files) => {
    setPlatform('ios');
    const onImagePaste = jest.fn();
    const { getByTestId } = render(
      <LinkifiedTextarea onImagePaste={onImagePaste} />,
    );

    await expect(
      getByTestId('paste-input').props.onPaste(undefined, files),
    ).resolves.toBeUndefined();
    expect(onImagePaste).not.toHaveBeenCalled();
  });

  it('retains the styled-children behavior on web', () => {
    setPlatform('web');
    const textStyle = [{ letterSpacing: 7 }];
    const linkifiedValue = 'Visit https://example.com';
    const { getByTestId, getByText } = render(
      <LinkifiedTextarea value={linkifiedValue} textStyle={textStyle} />,
    );

    const input = getByTestId('paste-input');
    const styledChild = getByText(linkifiedValue);
    expect(input.props.value).toBeUndefined();
    expect(styledChild.type).toBe('Text');
    expect(styledChild.props.children).toBe(linkifiedValue);
    expect(styledChild.props.style).toEqual(
      expect.arrayContaining([textStyle]),
    );
  });
});
