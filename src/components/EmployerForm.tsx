import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmployerStore } from '../store/employerStore';
import { useShiftStore } from '../store/shiftStore';
import { useSettingsStore } from '../store/settingsStore';
import { TimeInput } from './TimeInput';
import { TaxCodeGuideModal } from './TaxCodeGuideModal';
import { COUNTRIES } from '../config/countries';
import type { Employer, TaxCode, PaymentMethod } from '../types';
import { Colors } from '../constants/colors';

const JOB_CATEGORIES = [
  'カフェ/レストラン', 'バー/ナイトクラブ', '小売/ショップ', '農場/果樹園',
  '工場/倉庫', '清掃/ハウスキーピング', '建設/土木', '観光/ツアー', 'オフィス', 'その他',
];

const ENGLISH_LEVELS = [
  { value: 'none', label: '不要' },
  { value: 'basic', label: '日常会話' },
  { value: 'business', label: 'ビジネス' },
];

const VISA_OPTIONS = [
  { value: 'WHV', label: 'ワーホリ' },
  { value: 'Student', label: '学生ビザ' },
  { value: 'Work', label: 'ワークビザ' },
  { value: 'Other', label: 'その他' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank', label: '銀行振込' },
  { value: 'cash', label: '現金' },
  { value: 'other', label: 'その他' },
];

const TAX_CODES: { code: TaxCode; label: string }[] = [
  { code: 'M',    label: 'M — メイン雇用（学生ローンなし）' },
  { code: 'M SL', label: 'M SL — メイン雇用（学生ローンあり）' },
  { code: 'S',    label: 'S — サブ雇用' },
  { code: 'SH',   label: 'SH — サブ雇用（高税率）' },
  { code: 'ST',   label: 'ST — サブ雇用（最高税率）' },
  { code: 'SB',   label: 'SB — サブ雇用（年収 $15,600 以下・10.5%）' },
  { code: 'SA',   label: 'SA — スペシャル（要IRD承認）' },
];

interface Props {
  existing?: Employer;
}

export function EmployerForm({ existing }: Props) {
  const addEmployer = useEmployerStore((s) => s.add);
  const updateEmployer = useEmployerStore((s) => s.update);
  const removeEmployer = useEmployerStore((s) => s.remove);
  const shifts = useShiftStore((s) => s.shifts);
  const { currentCountry } = useSettingsStore();

  const [country] = useState<string>(existing?.country ?? currentCountry);
  const countryConfig = COUNTRIES[country as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const isAU = country === 'AU';

  const shiftCount = useMemo(
    () => existing ? shifts.filter((s) => s.employerId === existing.id).length : 0,
    [shifts, existing],
  );
  const reviewLocked = shiftCount < 3;

  const [name, setName] = useState(existing?.name ?? '');
  const [hourlyRate, setHourlyRate] = useState(
    existing ? String(existing.hourlyRate) : '',
  );
  const [taxCode, setTaxCode] = useState<TaxCode>(existing?.taxCode ?? 'M');
  const [showTaxGuide, setShowTaxGuide] = useState(false);
  const [irdNumber, setIrdNumber] = useState(existing?.irdNumber ?? '');
  const [defaultStartTime, setDefaultStartTime] = useState(existing?.defaultStartTime ?? '');
  const [defaultEndTime, setDefaultEndTime] = useState(existing?.defaultEndTime ?? '');
  const [defaultBreakMinutes, setDefaultBreakMinutes] = useState(
    existing?.defaultBreakMinutes != null ? String(existing.defaultBreakMinutes) : '',
  );
  const [region, setRegion] = useState(existing?.region ?? '');
  const [friendsVisible, setFriendsVisible] = useState(existing?.friendsVisible ?? false);
  const [holidayPayIncluded, setHolidayPayIncluded] = useState(existing?.holidayPayIncluded ?? false);
  const [holidayPaySeparate, setHolidayPaySeparate] = useState(existing?.holidayPaySeparate ?? false);
  const [hasNightShift, setHasNightShift] = useState(!!(existing?.nightShiftStart));
  const [nightShiftStart, setNightShiftStart] = useState(existing?.nightShiftStart ?? '22:00');
  const [nightShiftBonus, setNightShiftBonus] = useState(
    existing?.nightShiftBonus != null ? String(existing.nightShiftBonus) : '',
  );
  const [hasOvertime, setHasOvertime] = useState(!!(existing?.overtimeThreshold));
  const [overtimeThreshold, setOvertimeThreshold] = useState(
    existing?.overtimeThreshold != null ? String(existing.overtimeThreshold) : '8',
  );
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(
    existing?.overtimeMultiplier != null ? String(existing.overtimeMultiplier) : '1.25',
  );
  const [isShared, setIsShared] = useState(existing?.isShared ?? false);
  const [pubPaymentMethod, setPubPaymentMethod] = useState<PaymentMethod | ''>(existing?.paymentMethod ?? '');
  const [jobCategory, setJobCategory] = useState(existing?.jobCategory ?? '');
  const [jobDescription, setJobDescription] = useState(existing?.jobDescription ?? '');
  const [englishLevel, setEnglishLevel] = useState(existing?.englishLevel ?? '');
  const [visaTypes, setVisaTypes] = useState<string[]>(
    existing?.visaTypes ? existing.visaTypes.split(',') : [],
  );
  const [publicMemo, setPublicMemo] = useState(existing?.publicMemo ?? '');
  const [hasInterview, setHasInterview] = useState(existing?.hasInterview ?? false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard' | ''>(existing?.difficulty ?? '');
  const [isHiring, setIsHiring] = useState(existing?.isHiring ?? false);
  const [address, setAddress] = useState(existing?.address ?? '');
  const [contactInfo, setContactInfo] = useState(existing?.contactInfo ?? '');

  function handleDelete() {
    if (!existing) return;
    const hasShifts = shifts.some((s) => s.employerId === existing.id);
    const msg = hasShifts
      ? `「${existing.name}」を削除すると、関連するシフト記録もすべて削除されます。よろしいですか？`
      : `「${existing.name}」を削除しますか？`;
    Alert.alert('雇用主を削除', msg, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => { removeEmployer(existing.id); router.back(); } },
    ]);
  }

  function handleSave() {
    const rate = parseFloat(hourlyRate);
    if (!name.trim()) {
      Alert.alert('入力エラー', '雇用主名を入力してください');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      Alert.alert('入力エラー', '正しい時給を入力してください');
      return;
    }
    const isValidTime = (t: string) => /^\d{2}:\d{2}$/.test(t);
    const hasDefaultTime = defaultStartTime || defaultEndTime;
    if (hasDefaultTime && (!isValidTime(defaultStartTime) || !isValidTime(defaultEndTime))) {
      Alert.alert('入力エラー', 'デフォルト時間は両方入力してください');
      return;
    }
    const data = {
      name: name.trim(),
      country,
      hourlyRate: rate,
      taxCode,
      irdNumber: irdNumber.trim() || undefined,
      defaultStartTime: isValidTime(defaultStartTime) ? defaultStartTime : undefined,
      defaultEndTime: isValidTime(defaultEndTime) ? defaultEndTime : undefined,
      defaultBreakMinutes: defaultBreakMinutes ? Number(defaultBreakMinutes) : undefined,
      region: region || undefined,
      friendsVisible,
      holidayPayIncluded,
      holidayPaySeparate,
      nightShiftStart: hasNightShift ? nightShiftStart : undefined,
      nightShiftBonus: hasNightShift && nightShiftBonus ? parseFloat(nightShiftBonus) : undefined,
      overtimeThreshold: hasOvertime && overtimeThreshold ? parseFloat(overtimeThreshold) : undefined,
      overtimeMultiplier: hasOvertime && overtimeMultiplier ? parseFloat(overtimeMultiplier) : undefined,
      isShared,
      paymentMethod: (pubPaymentMethod || undefined) as PaymentMethod | undefined,
      jobCategory: jobCategory || undefined,
      jobDescription: jobDescription || undefined,
      englishLevel: englishLevel || undefined,
      visaTypes: visaTypes.length > 0 ? visaTypes.join(',') : undefined,
      publicMemo: publicMemo || undefined,
      hasInterview,
      difficulty: difficulty || undefined,
      isHiring,
      address: address.trim() || undefined,
      contactInfo: contactInfo.trim() || undefined,
    };
    if (existing) {
      const isFirstReview = !existing.reviewSharedAt && (data.jobDescription || data.englishLevel || data.publicMemo);
      const isFirstDetail = !existing.detailSharedAt && (data.address || data.contactInfo);
      updateEmployer(existing.id, data);
      if (isFirstDetail) {
        Alert.alert('ありがとうございます！', '住所・連絡先の初回登録でチケットを2枚獲得しました 🎟🎟');
      } else if (isFirstReview) {
        Alert.alert('ありがとうございます！', '職場レビューの初回更新でチケットを1枚獲得しました 🎟');
      }
    } else {
      addEmployer(data);
    }
    router.back();
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* 雇用主名 */}
      <Text style={styles.label}>雇用主名 *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="例: Cafe Kiwi, Auckland Farms"
        returnKeyType="next"
      />

      {/* 時給 */}
      <Text style={[styles.label, styles.labelSpacing]}>
        時給（{countryConfig.currency}）*
      </Text>
      <View style={styles.rateRow}>
        <Text style={styles.ratePrefix}>$</Text>
        <TextInput
          style={[styles.input, styles.rateInput]}
          value={hourlyRate}
          onChangeText={setHourlyRate}
          placeholder={String(countryConfig.minWage)}
          keyboardType="decimal-pad"
        />
      </View>
      <Text style={styles.hint}>
        最低賃金: {countryConfig.currency} {countryConfig.minWage}/h
      </Text>

      {/* 税コード（NZ のみ） */}
      {!isAU ? (
        <>
          <TaxCodeGuideModal
            visible={showTaxGuide}
            onClose={() => setShowTaxGuide(false)}
            onSelect={(code) => setTaxCode(code)}
          />
          <View style={[styles.taxCodeLabelRow, styles.labelSpacing]}>
            <Text style={[styles.label, { marginBottom: 0 }]}>税コード *</Text>
            <Pressable style={styles.guideBtn} onPress={() => setShowTaxGuide(true)}>
              <Ionicons name="help-circle-outline" size={15} color={Colors.primary} />
              <Text style={styles.guideBtnText}>ガイドで確認</Text>
            </Pressable>
          </View>
          <View style={styles.taxCodeList}>
            {TAX_CODES.map(({ code, label }) => (
              <Pressable
                key={code}
                style={[styles.taxCodeItem, taxCode === code && styles.taxCodeItemSelected]}
                onPress={() => setTaxCode(code)}
              >
                <View style={[styles.radio, taxCode === code && styles.radioSelected]}>
                  {taxCode === code && <View style={styles.radioDot} />}
                </View>
                <View style={styles.taxCodeTextWrap}>
                  <Text style={[styles.taxCodeText, taxCode === code && styles.taxCodeTextSelected]}>
                    {label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>
            初めての職場はほとんどの場合「M」。掛け持ちのサブ職場は「S」を選択。
          </Text>
        </>
      ) : (
        <View style={[styles.auTaxInfo, styles.labelSpacing]}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.auTaxTitle}>AU ワーホリ税率</Text>
            <Text style={styles.auTaxBody}>
              ワーキングホリデービザ保持者は年収 $45,000 まで一律 15% の PAYE が適用されます。
              税コードの選択は不要です。
            </Text>
          </View>
        </View>
      )}

      {/* 地域 */}
      <Text style={[styles.label, styles.labelSpacing]}>地域（任意）</Text>
      <Text style={styles.hint}>勤務地を選択するとコミュニティで地域フィルターに使われます</Text>
      <View style={[styles.regionGrid, { marginTop: 8 }]}>
        {countryConfig.regions.map((r) => (
          <Pressable
            key={r}
            style={[styles.regionChip, region === r && styles.regionChipSelected]}
            onPress={() => setRegion(region === r ? '' : r)}
          >
            <Text style={[styles.regionChipText, region === r && styles.regionChipTextSelected]}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 友達への勤務履歴公開 */}
      <View style={[styles.shareHeader, styles.labelSpacing]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>友達に勤務先を公開する</Text>
          <Text style={styles.hint}>ONにすると友達があなたの勤務先名を確認できます（時給・シフト詳細は非公開）</Text>
        </View>
        <Switch
          value={friendsVisible}
          onValueChange={setFriendsVisible}
          trackColor={{ true: Colors.primary }}
        />
      </View>

      {/* Holiday Pay設定（NZのみ） */}
      {!isAU && (
        <View style={[styles.hpCard, styles.labelSpacing]}>
          <Text style={styles.hpTitle}>Holiday Pay (8%)</Text>
          <View style={styles.hpRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>時給に含まれている</Text>
              <Text style={styles.hint}>時給にHP 8%が上乗せされている場合</Text>
            </View>
            <Switch
              value={holidayPayIncluded}
              onValueChange={(v) => { setHolidayPayIncluded(v); if (v) setHolidayPaySeparate(false); }}
              trackColor={{ true: Colors.primary }}
            />
          </View>
          <View style={[styles.hpRow, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8, paddingTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>別途支給</Text>
              <Text style={styles.hint}>HP分が別払いで支給される場合</Text>
            </View>
            <Switch
              value={holidayPaySeparate}
              onValueChange={(v) => { setHolidayPaySeparate(v); if (v) setHolidayPayIncluded(false); }}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>
      )}

      {/* 手当設定 */}
      <View style={[styles.hpCard, styles.labelSpacing]}>
        <Text style={styles.hpTitle}>手当設定</Text>

        {/* 夜勤手当 */}
        <View style={styles.hpRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>夜勤手当</Text>
            <Text style={styles.hint}>深夜時間帯の割増額（$/h）</Text>
          </View>
          <Switch
            value={hasNightShift}
            onValueChange={setHasNightShift}
            trackColor={{ true: Colors.primary }}
          />
        </View>
        {hasNightShift && (
          <View style={{ marginTop: 12, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hint}>夜勤開始時刻</Text>
                <TimeInput label="" value={nightShiftStart} onChange={setNightShiftStart} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hint}>割増額（$/h）</Text>
                <TextInput
                  style={styles.input}
                  value={nightShiftBonus}
                  onChangeText={setNightShiftBonus}
                  keyboardType="decimal-pad"
                  placeholder="3.00"
                />
              </View>
            </View>
          </View>
        )}

        {/* 残業手当 */}
        <View style={[styles.hpRow, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12, paddingTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>残業手当</Text>
            <Text style={styles.hint}>閾値超過後の割増率（例: 1.25）</Text>
          </View>
          <Switch
            value={hasOvertime}
            onValueChange={setHasOvertime}
            trackColor={{ true: Colors.primary }}
          />
        </View>
        {hasOvertime && (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hint}>閾値（時間）</Text>
                <TextInput
                  style={styles.input}
                  value={overtimeThreshold}
                  onChangeText={setOvertimeThreshold}
                  keyboardType="decimal-pad"
                  placeholder="8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hint}>割増率</Text>
                <TextInput
                  style={styles.input}
                  value={overtimeMultiplier}
                  onChangeText={setOvertimeMultiplier}
                  keyboardType="decimal-pad"
                  placeholder="1.25"
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* コミュニティ公開設定 */}
      <View style={[styles.shareHeader, styles.labelSpacing]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>コミュニティに公開する</Text>
          <Text style={styles.hint}>時給・仕事内容などをみんなに共有（初回公開でチケット+1）</Text>
        </View>
        <Switch
          value={isShared}
          onValueChange={setIsShared}
          trackColor={{ true: Colors.primary }}
        />
      </View>

      {isShared && (
        <>
          {/* 支払方法 */}
          <Text style={[styles.label, { marginTop: 16 }]}>支払方法</Text>
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map(({ value, label }) => (
              <Pressable
                key={value}
                style={[styles.chip, pubPaymentMethod === value && styles.chipSelected]}
                onPress={() => setPubPaymentMethod(pubPaymentMethod === value ? '' : value)}
              >
                <Text style={[styles.chipText, pubPaymentMethod === value && styles.chipTextSelected]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 業種カテゴリ */}
          <Text style={[styles.label, { marginTop: 16 }]}>業種カテゴリ</Text>
          <View style={styles.chipRow}>
            {JOB_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.chip, jobCategory === cat && styles.chipSelected]}
                onPress={() => setJobCategory(jobCategory === cat ? '' : cat)}
              >
                <Text style={[styles.chipText, jobCategory === cat && styles.chipTextSelected]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* レビュー項目（3シフト以上で解放） */}
          {reviewLocked ? (
            <View style={styles.reviewLock}>
              <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewLockTitle}>職場レビュー（{shiftCount}/3シフト）</Text>
                <Text style={styles.reviewLockSub}>
                  同じ職場で3回シフトを入力すると、仕事内容・英語力・職場メモを追加できます
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.reviewUnlockBadge}>
                <Ionicons name="checkmark-circle" size={15} color={Colors.positive} />
                <Text style={styles.reviewUnlockText}>職場レビューが解放されました</Text>
              </View>

              {/* 仕事内容 */}
              <Text style={[styles.label, { marginTop: 16 }]}>仕事内容（任意）</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="例: ホールスタッフ、皿洗い、レジ対応など"
                multiline
                numberOfLines={3}
              />

              {/* 英語力 */}
              <Text style={[styles.label, { marginTop: 16 }]}>英語力</Text>
              <View style={styles.chipRow}>
                {ENGLISH_LEVELS.map(({ value, label }) => (
                  <Pressable
                    key={value}
                    style={[styles.chip, englishLevel === value && styles.chipSelected]}
                    onPress={() => setEnglishLevel(englishLevel === value ? '' : value)}
                  >
                    <Text style={[styles.chipText, englishLevel === value && styles.chipTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* 自由メモ */}
              <Text style={[styles.label, { marginTop: 16 }]}>メモ（任意）</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={publicMemo}
                onChangeText={setPublicMemo}
                placeholder="例: 電子レンジあり、まかない付き、駐車場あり..."
                multiline
                numberOfLines={3}
              />

              {/* 面接の有無 */}
              <View style={[styles.shareHeader, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>面接あり</Text>
                  <Text style={styles.hint}>応募時に面接がある場合はON</Text>
                </View>
                <Switch value={hasInterview} onValueChange={setHasInterview} trackColor={{ true: Colors.primary }} />
              </View>

              {/* 仕事の難易度 */}
              <Text style={[styles.label, { marginTop: 16 }]}>仕事の難易度</Text>
              <View style={styles.chipRow}>
                {([['easy', 'ラク'], ['normal', '普通'], ['hard', 'きつい']] as const).map(([v, l]) => (
                  <Pressable
                    key={v}
                    style={[styles.chip, difficulty === v && styles.chipSelected]}
                    onPress={() => setDifficulty(difficulty === v ? '' : v)}
                  >
                    <Text style={[styles.chipText, difficulty === v && styles.chipTextSelected]}>{l}</Text>
                  </Pressable>
                ))}
              </View>

              {/* 募集中 */}
              <View style={[styles.shareHeader, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>現在募集中</Text>
                  <Text style={styles.hint}>求人が出ていると思われる場合はON</Text>
                </View>
                <Switch value={isHiring} onValueChange={setIsHiring} trackColor={{ true: Colors.primary }} />
              </View>
            </>
          )}

          {/* 住所・連絡先（詳細情報・チケット+2） */}
          <View style={[styles.detailCard, { marginTop: 16 }]}>
            <View style={styles.detailHeader}>
              <Ionicons name="ticket-outline" size={15} color={Colors.positive} />
              <Text style={styles.detailHeaderText}>詳細情報（初回登録でチケット+2）</Text>
            </View>
            <Text style={[styles.label, { marginTop: 12 }]}>住所（任意）</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="例: 123 Queen St, Auckland"
            />
            <Text style={[styles.label, { marginTop: 12 }]}>連絡先（任意）</Text>
            <TextInput
              style={styles.input}
              value={contactInfo}
              onChangeText={setContactInfo}
              placeholder="例: info@cafe.co.nz / 09-xxx-xxxx"
            />
            <Text style={styles.hint}>住所・連絡先はチケットを消費したユーザーのみ閲覧できます</Text>
          </View>

          {/* 対応ビザ（基本情報として常に表示） */}
          <Text style={[styles.label, { marginTop: 16 }]}>対応ビザ（複数選択可）</Text>
          <View style={styles.chipRow}>
            {VISA_OPTIONS.map(({ value, label }) => {
              const selected = visaTypes.includes(value);
              return (
                <Pressable
                  key={value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() =>
                    setVisaTypes(selected ? visaTypes.filter((v) => v !== value) : [...visaTypes, value])
                  }
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* IRD / TFN 番号（任意） */}
      <Text style={[styles.label, styles.labelSpacing]}>
        {countryConfig.taxNumberLabel}（任意）
      </Text>
      <TextInput
        style={styles.input}
        value={irdNumber}
        onChangeText={setIrdNumber}
        placeholder="000-000-000"
        keyboardType="number-pad"
      />
      <Text style={styles.hint}>給与明細や税務書類に記載されている番号</Text>

      {/* デフォルト勤務時間 */}
      <Text style={[styles.label, styles.labelSpacing]}>デフォルト勤務時間（任意）</Text>
      <Text style={styles.hint}>設定するとホーム画面からワンタップで出勤記録できます</Text>
      <View style={[styles.timeRow, { marginTop: 8 }]}>
        <TimeInput label="開始" value={defaultStartTime || '09:00'} onChange={setDefaultStartTime} />
        <Text style={styles.timeSep}>–</Text>
        <TimeInput label="終了" value={defaultEndTime || '17:00'} onChange={setDefaultEndTime} />
      </View>
      <Text style={[styles.label, { marginTop: 16 }]}>デフォルト休憩（分）</Text>
      <TextInput
        style={styles.input}
        value={defaultBreakMinutes}
        onChangeText={setDefaultBreakMinutes}
        keyboardType="number-pad"
        placeholder="60"
      />

      {/* 保存ボタン */}
      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>
          {existing ? '更新する' : '雇用主を追加'}
        </Text>
      </Pressable>

      {existing && (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.negative} />
          <Text style={styles.deleteBtnText}>この雇用主を削除</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  labelSpacing: { marginTop: 20 },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratePrefix: { fontSize: 24, color: Colors.textSecondary, fontWeight: '600' },
  rateInput: { flex: 1, fontSize: 24, fontWeight: '700' },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  timeSep: { fontSize: 20, color: Colors.textMuted, marginBottom: 14, paddingHorizontal: 4 },

  // 税コードラベル行
  taxCodeLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  guideBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  guideBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  // 税コード選択
  taxCodeList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  taxCodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  taxCodeItemSelected: { backgroundColor: Colors.primarySubtle },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  taxCodeTextWrap: { flex: 1 },
  taxCodeText: { fontSize: 14, color: Colors.textPrimary },
  taxCodeTextSelected: { color: Colors.primary, fontWeight: '600' },

  // 地域
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  regionChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  regionChipText: { fontSize: 13, color: Colors.textPrimary },
  regionChipTextSelected: { color: Colors.textInverse, fontWeight: '600' },

  // Holiday Pay
  hpCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  hpTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12 },
  hpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // 公開設定
  shareHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textPrimary },
  chipTextSelected: { color: Colors.textInverse, fontWeight: '600' },

  // レビューロック
  reviewLock: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginTop: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  reviewLockTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  reviewLockSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  reviewUnlockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primarySubtle, borderRadius: 10, padding: 10, marginTop: 16,
  },
  reviewUnlockText: { fontSize: 13, color: Colors.positive, fontWeight: '600' },

  // AU税情報
  auTaxInfo: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  auTaxTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  auTaxBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  // 詳細情報カード
  detailCard: {
    backgroundColor: Colors.primarySubtle, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.primaryMuted,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailHeaderText: { fontSize: 13, fontWeight: '700', color: Colors.positive },

  // 保存
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: { color: Colors.textInverse, fontSize: 17, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.negative, borderRadius: 14,
    padding: 14, marginTop: 12, marginBottom: 8,
  },
  deleteBtnText: { color: Colors.negative, fontSize: 15, fontWeight: '600' },
});
