import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next';

// Empty component
export const Empty = () => {
  const { t } = useTranslation();
  return (
    <div className={cn('flex h-full items-center justify-center')}>{t('common.empty')}</div>
  )
}

export default Empty;
