import React from 'react'
import { ProfilePic } from './ProfilePic'
import { UsernameText } from './UsernameText'
import { useTranslation } from 'react-i18next'

export function SuggestionItem({ data }: any) {
  const { t } = useTranslation()
  return (
    <div className="suggestion-item py-2 h-auto flex items-center">
      <ProfilePic size={32} src={data.image} username={data.username} />
      <div className="suggestion-user-info ml-3 flex flex-col">
        <UsernameText username={data.username} className="text-14-bold cursor-pointer" />
        <span className="text-12-light">{data?.text}</span>
      </div>
      <div className="follow-button text-12-bold flex items-center ml-auto text-blue cursor-pointer">
        {t('social:follow')}
      </div>
    </div>
  )
}
