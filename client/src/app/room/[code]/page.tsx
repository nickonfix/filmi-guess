import GameRoom from '@/components/GameRoom';

export default function RoomPage({ params }: { params: { code: string } }) {
  return <GameRoom code={params.code.toUpperCase()} />;
}
