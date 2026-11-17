export default function ProductSkeleton() {
  return (
    <div className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-4 flex flex-col justify-between animate-pulse">
      <div>
        {/* Image Skeleton */}
        <div className="w-full h-52 bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl mb-4" />
        
        {/* Title Skeleton */}
        <div className="h-4 bg-[#FAF7F5] rounded-full w-3/4 mb-2" />
        
        {/* Description Skeleton */}
        <div className="h-3 bg-[#FAF7F5] rounded-full w-full mb-1" />
        <div className="h-3 bg-[#FAF7F5] rounded-full w-5/6 mb-4" />
      </div>

      {/* Price & Button Skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E5DFDA]">
        <div className="h-4 bg-[#FAF7F5] rounded-full w-20" />
        <div className="h-8 bg-[#FAF7F5] rounded-full w-16" />
      </div>
    </div>
  );
}