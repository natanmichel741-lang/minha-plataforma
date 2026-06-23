// Layout sem sidebar — o flow builder usa tela cheia
export default function FlowEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50">
      {children}
    </div>
  )
}
