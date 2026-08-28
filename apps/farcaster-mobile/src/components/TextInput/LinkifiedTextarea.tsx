import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import PasteInput, {
  PastedFile,
  PasteTextInputInstance as PasteInputRef,
} from '@mattermost/react-native-paste-input';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useUnfocusInputs } from 'farcaster-expo';
import React, { RefObject, useEffect, useRef } from 'react';
import {
  Platform,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { BottomSheetPasteInput } from '~/components/BottomSheet/BottomSheetPasteInput';
import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useLinkifyText } from '~/hooks/useLinkifyText';
import { LinkifyInstanceType } from '~/utils/LinkifyUtils';

import { getFirstPastedImage } from './PastedImageUtils';

export type TextareaProps = Omit<TextInputProps, 'children'> & {
  bordered?: boolean;
  containerStyle?: ViewStyle[];
  height?: number;
  inputStyle?: TextStyle[];
  textStyle?: TextStyle[];
  maxHeight?: number;
  maxLength?: number;
  minHeight?: number;
  textAlign?: 'left' | 'center';
  userMentions?: string[];
  channelMentions?: string[];
  onImagePaste?: ({ pastedImageFile }: { pastedImageFile: PastedFile }) => void;
  linkifyInstance?: LinkifyInstanceType;
  ref?: RefObject<null | PasteInputRef>;
  inBottomSheet?: boolean;
};

const LinkifiedTextarea = ({
  autoCapitalize = 'sentences',
  autoCorrect = true,
  autoFocus,
  editable = true,
  keyboardType = 'default',
  height,
  maxLength,
  maxHeight,
  minHeight,
  multiline = true,
  numberOfLines,
  onBlur,
  onChangeText,
  onFocus,
  onSelectionChange,
  onKeyPress,
  placeholder,
  scrollEnabled = true,
  spellCheck = true,
  containerStyle,
  inputStyle,
  style,
  textStyle,
  textAlign = 'left',
  textAlignVertical = 'top',
  value = '',
  userMentions,
  channelMentions,
  onImagePaste,
  linkifyInstance,
  ref,
  inBottomSheet,
  ...inputProps
}: TextareaProps) => {
  const t = useTheme();

  const fallbackRef: RefObject<null | PasteInputRef> =
    useRef<PasteInputRef>(null);
  const inputRef = (ref || fallbackRef) as RefObject<null | PasteInputRef>;
  const { trackEvent } = useAnalytics();

  const { addListener, removeListener } = useUnfocusInputs();

  const onPaste = React.useCallback(
    async (err: string | undefined, files: PastedFile[]) => {
      if (err) {
        return;
      }
      DdRum.addAction(
        RumActionType.CUSTOM,
        'PastedFile.LinkifiedTextarea.onPaste',
        {},
      );
      trackEvent(AnalyticsEvent.MiscPastedFile, {
        source: 'LinkifiedTextarea',
      });

      const firstImageMatchedFromPastedFiles = getFirstPastedImage(files);

      if (
        typeof firstImageMatchedFromPastedFiles !== 'undefined' &&
        typeof onImagePaste !== 'undefined'
      ) {
        onImagePaste({ pastedImageFile: firstImageMatchedFromPastedFiles });
      }
    },
    [onImagePaste, trackEvent],
  );

  useEffect(() => {
    const onUnfocusInputs = () => {
      inputRef.current?.blur();
    };
    addListener(onUnfocusInputs);
    return () => removeListener(onUnfocusInputs);
  }, [addListener, inputRef, removeListener]);

  return (
    <View
      style={[
        t.bgInput,
        t.roundedLg,
        t.flexShrink,
        t.flexGrow0,
        containerStyle,
      ]}
    >
      <LinkifiedPasteInput
        {...inputProps}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoFocus={autoFocus}
        editable={editable}
        keyboardType={keyboardType}
        inBottomSheet={inBottomSheet}
        inputRef={inputRef}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onPaste={onPaste}
        onKeyPress={onKeyPress}
        onSelectionChange={onSelectionChange}
        placeholder={placeholder}
        scrollEnabled={scrollEnabled}
        spellCheck={spellCheck}
        height={height}
        inputStyle={inputStyle}
        linkifyInstance={linkifyInstance}
        maxHeight={maxHeight}
        minHeight={minHeight}
        style={style}
        textAlign={textAlign}
        textStyle={textStyle}
        textAlignVertical={textAlignVertical}
        userMentions={userMentions}
        channelMentions={channelMentions}
        value={value}
      />
    </View>
  );
};

type LinkifiedPasteInputProps = Omit<
  TextareaProps,
  'containerStyle' | 'onImagePaste' | 'ref'
> & {
  inputRef: RefObject<null | PasteInputRef>;
  onPaste: (err: string | undefined, files: PastedFile[]) => Promise<void>;
};

type LinkifiedTextProps = Pick<
  TextareaProps,
  'channelMentions' | 'linkifyInstance' | 'textStyle' | 'userMentions' | 'value'
>;

const LinkifiedText = ({
  channelMentions,
  linkifyInstance,
  textStyle,
  userMentions,
  value = '',
}: LinkifiedTextProps) => {
  const t = useTheme();
  const { linkifiedText } = useLinkifyText({
    text: value,
    mentions: userMentions,
    channelMentions,
    options: {
      // Pasted cast links shouldn't be truncated since they will
      // be stored truncated on cast text.
      skipFarcasterLinkTruncate: true,
      skipURLTruncates: true,
      applyInvertedLinkStyles: [],
      linkifyInstance,
      textChangeAllowed: false,
      treatImageUrlsAsLinks: true,
    },
  });

  return (
    <Text style={[t.texts.primary, t.textLg, textStyle]}>{linkifiedText}</Text>
  );
};

const LinkifiedPasteInput = ({
  autoCapitalize,
  autoCorrect,
  autoFocus,
  editable,
  keyboardType,
  height,
  maxLength,
  maxHeight,
  minHeight,
  multiline,
  numberOfLines,
  onBlur,
  onChangeText,
  onFocus,
  onSelectionChange,
  onKeyPress,
  onPaste,
  placeholder,
  scrollEnabled,
  spellCheck,
  inputRef,
  inputStyle,
  style,
  textStyle,
  textAlign,
  textAlignVertical,
  value = '',
  userMentions,
  channelMentions,
  linkifyInstance,
  inBottomSheet,
  ...inputProps
}: LinkifiedPasteInputProps) => {
  const t = useTheme();
  const PasteInputComponent = inBottomSheet
    ? BottomSheetPasteInput
    : PasteInput;
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <PasteInputComponent
      {...inputProps}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      autoFocus={autoFocus}
      editable={editable}
      keyboardType={keyboardType}
      hitSlop={hitSlop}
      maxLength={maxLength}
      multiline={multiline}
      numberOfLines={numberOfLines}
      onBlur={onBlur}
      onChangeText={onChangeText}
      onFocus={onFocus}
      onPaste={onPaste}
      onKeyPress={onKeyPress}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      placeholderTextColor={t.colors.text.tertiary}
      ref={inputRef}
      scrollEnabled={scrollEnabled}
      selectionColor={t.colors.selection}
      spellCheck={spellCheck}
      style={[
        textAlign === 'center' ? t.textCenter : t.textLeft,
        t.texts.primary,
        t.textLg,
        t.alignCenter,
        {
          height,
          minHeight,
          maxHeight,
        },
        style,
        inputStyle,
      ]}
      textAlignVertical={textAlignVertical}
      value={isNative ? value : undefined}
    >
      {isNative ? undefined : (
        <LinkifiedText
          channelMentions={channelMentions}
          linkifyInstance={linkifyInstance}
          textStyle={textStyle}
          userMentions={userMentions}
          value={value}
        />
      )}
    </PasteInputComponent>
  );
};

LinkifiedTextarea.displayName = 'LinkifiedTextarea';

export { LinkifiedTextarea };
